import React, { useEffect, useState } from "react";
import "./manageUser.css";
import { collection, getDocs, deleteDoc, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db, auth } from "../firebase/config";
import { createUserWithEmailAndPassword } from "firebase/auth";
import Navbar from "./NavBar";

const ManageUsers = ({ user, onLogout }) => {
  const [users, setUsers] = useState([]);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [newUser, setNewUser] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    role: "doctor",
  });

  const loadUsers = async () => {
    const usersCol = collection(db, "gp");
    const userSnapshot = await getDocs(usersCol);
    const userList = userSnapshot.docs.map((snap) => ({
      firebaseId: snap.id,
      ...snap.data(),
    }));
    setUsers(userList);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleAddUser = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newUser.email,
        newUser.password
      );
      const uid = userCredential.user.uid;

      await setDoc(doc(db, "gp", uid), {
        UID: uid,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        email: newUser.email,
        role: newUser.role,
        gp_ID: findHighestGPID(),     
      });

      alert("User added successfully.");
      setShowAddUserForm(false);
      setNewUser({
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        role: "doctor",
      });
      loadUsers();
    } catch (error) {
      console.error(error);
      alert("Failed to add user.");
    }
  };

  const handleDeleteUser = async (firebaseId) => {
    try {
      await deleteDoc(doc(db, "gp", firebaseId));
      alert("User deleted successfully.");
      loadUsers();
    } catch (error) {
      console.error(error);
      alert("Failed to delete user. Please try again.");
    }
  };
  const findHighestGPID = () => {
    let highestID = 0;
    let gp_id = "";
    users.forEach((u) => {
      const gpIDNum = parseInt(u.gp_ID, 10);
      if (gpIDNum > highestID) {
        highestID = gpIDNum;
        gp_id = highestID + 1;
      }
    });
    return gp_id;
    
  }

  return (
    <>
      <Navbar user={user} onLogout={onLogout} />
      <div className="manage-users-container">
        <h2>Manage Users</h2>

      <button
        className="add-button"
        onClick={() => setShowAddUserForm((prev) => !prev)}
      >
        {showAddUserForm ? "Cancel" : "Add User"}
      </button>
      {showAddUserForm && (
        <div className="add-user-form">
          <input
            type="text"
            placeholder="First name"
            value={newUser.first_name}
            onChange={(e) =>
              setNewUser({ ...newUser, first_name: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="Last name"
            value={newUser.last_name}
            onChange={(e) =>
              setNewUser({ ...newUser, last_name: e.target.value })
            }
          />
          <input
            type="email"
            placeholder="Email"
            value={newUser.email}
            onChange={(e) =>
              setNewUser({ ...newUser, email: e.target.value })
            }
          />
          <input
            type="password"
            placeholder="Password"
            value={newUser.password}
            onChange={(e) =>
              setNewUser({ ...newUser, password: e.target.value })
            }
          />

          <select
            value={newUser.role}
            onChange={(e) =>
              setNewUser({ ...newUser, role: e.target.value })
            }
          >
            <option value="doctor">Doctor</option>
            <option value="nurse">Nurse</option>
            <option value="admin">Admin</option>
          </select>

          <button className="save-button" onClick={handleAddUser}>
            Save
          </button>
        </div>
      )}

      <div className="user-table-container">
        <table className="user-table">
          <thead>
            <tr>
              <th>GP UID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {users.map((u) => (
              <tr key={u.firebaseId}>
                <td>{u.firebaseId}</td>
                <td>
                  {u.first_name} {u.last_name}
                </td>
                <td>{u.email}</td>
                <td className="role-cell">{u.role}</td>
                <td>
                  <button
                    className="delete-user-btn"
                    onClick={() => handleDeleteUser(u.firebaseId)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="5">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
    </>
  );
};

export default ManageUsers;
