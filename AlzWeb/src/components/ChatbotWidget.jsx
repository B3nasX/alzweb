import React, { useState, useEffect, useRef } from 'react';

/* ---------- 18-field form (same as before) ---------- */
const INITIAL_FORM = {
  Age: 70, Cognitive_Test_Scores: 10, AlcoholLevel: 0.05, Weight: 70, Diabetic: 0,
  HeartRate: 80, BloodOxygenLevel: 95, BodyTemperature: 36.5, MRI_Delay: 30,
  Education_Level: 'Secondary School', Gender: 'Female', Family_History: 'No',
  Smoking_Status: 'Never Smoked', APOE_ε4: 'Negative', Physical_Activity: 'Mild Activity',
  Depression_Status: 'No', Medication_History: 'No', Nutrition_Diet: 'Balanced Diet',
  Sleep_Quality: 'Good', Chronic_Health_Conditions: 'None'
};

const ChatbotWidget = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);

  const messagesEndRef = useRef(null);
  useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages]);

  /* ---------- helpers ---------- */
  const addMessage = (text, sender) => setMessages((m) => [...m, { text, sender }]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({
      ...f,
      [name]: ['Age', 'Cognitive_Test_Scores', 'AlcoholLevel', 'Weight', 'Diabetic', 'HeartRate', 'BloodOxygenLevel', 'BodyTemperature', 'MRI_Delay'].includes(name)
        ? parseFloat(value)
        : value
    }));
  };

  const isFormValid = Object.values(form).every((v) => v !== '' && !Number.isNaN(v));

  /* ---------- chat submit ---------- */
  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    addMessage(input, 'user');

    if (input.trim().toLowerCase() === 'predict') {
      addMessage('Please fill the form below for a risk prediction.', 'bot');
      setShowForm(true);
    } else {
      // general dementia Q&A
      askOllama(input);
    }
    setInput('');
  };

  /* ---------- general Q&A via FastAPI ---------- */
  const askOllama = async (question) => {
    setLoading(true);
    addMessage('Thinking…', 'bot');
    try {
      const res = await fetch('http://164.92.157.146:8000/qa', { // Update the URL to your FastAPI endpoint
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`LLM error: ${errorData.detail || 'Unknown error'}`);
      }
      const data = await res.json();
      addMessage(data.response, 'bot');
    } catch (err) {
      console.error(err);
      addMessage(`❌ ${err.message}`, 'bot');
    } finally {
      setLoading(false);
    }
  };

  /* ---------- risk prediction ---------- */
  const runPrediction = async () => {
    setLoading(true);
    addMessage('Analysing…', 'bot');
    try {
      const res = await fetch('http://164.92.157.146:8000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const json = await res.json();
      addMessage(`**Risk**: ${json.prediction}  \n**Probability**: ${json.probability}`, 'bot');
    } catch (err) {
      addMessage(`❌ ${err.message}`, 'bot');
    } finally {
      setLoading(false);
      setShowForm(false);          // hide form
      setForm(INITIAL_FORM);       // reset
    }
  };

  /* ---------- render ---------- */
  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          position: 'fixed', bottom: 24, left: 24, width: 56, height: 56, borderRadius: '50%',
          background: '#004d99', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,.25)', color: '#fff', fontSize: 24, cursor: 'pointer', zIndex: 1000,
        }}
      >
        🤖
      </button>

      {open && (
        <div style={{ position: 'fixed', bottom: 96, left: 24, width: 400, height: 640, background: '#fff', borderRadius: 16, boxShadow: '0 8px 30px rgba(0,0,0,.2)', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif', zIndex: 999 }}>
          <div style={{ background: '#004d99', color: '#fff', padding: '12px 16px', fontWeight: 600, borderTopLeftRadius: 16, borderTopRightRadius: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Dementia Assistant</span>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>×</button>
          </div>

          <div style={{ flex: 1, padding: 12, overflowY: 'auto' }}>
            {messages.length === 0 && <div style={{ color: '#666', fontSize: 14, marginBottom: 8 }}>Type <b>predict</b> for risk score or ask any dementia question.</div>}
            {messages.map((msg, i) => (
              <div key={i} style={{ textAlign: msg.sender === 'user' ? 'right' : 'left', marginBottom: 8 }}>
                <span style={{ display: 'inline-block', maxWidth: '80%', padding: '8px 12px', borderRadius: 12, background: msg.sender === 'user' ? '#004d99' : '#f1f3f5', color: msg.sender === 'user' ? '#fff' : '#000', fontSize: 14, whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: msg.text }} />
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* ---- form appears ONLY after "predict" ---- */}
          {showForm && (
            <div style={{ padding: 12, borderTop: '1px solid #e9ecef', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gap: 8, fontSize: 13 }}>
                {['Age', 'Cognitive_Test_Scores', 'AlcoholLevel', 'Weight', 'Diabetic', 'HeartRate', 'BloodOxygenLevel', 'BodyTemperature', 'MRI_Delay'].map((key) => (
                  <label key={key}>{key.replace(/_/g, ' ')}<input type="number" step={key === 'AlcoholLevel' || key === 'BodyTemperature' ? 0.01 : 1} name={key} value={form[key]} onChange={handleChange} /></label>
                ))}
                {['Education_Level', 'Gender', 'Family_History', 'Smoking_Status', 'APOE_ε4', 'Physical_Activity', 'Depression_Status', 'Medication_History', 'Nutrition_Diet', 'Sleep_Quality', 'Chronic_Health_Conditions'].map((key) => (
                  <label key={key}>
                    {key.replace(/_/g, ' ')}
                    <select name={key} value={form[key]} onChange={handleChange}>
                      {key === 'Education_Level' && ['Primary School', 'Secondary School', 'Diploma/Degree', 'No School'].map((v) => <option key={v}>{v}</option>)}
                      {key === 'Gender' && ['Male', 'Female'].map((v) => <option key={v}>{v}</option>)}
                      {key === 'Family_History' && ['Yes', 'No'].map((v) => <option key={v}>{v}</option>)}
                      {key === 'Smoking_Status' && ['Never Smoked', 'Former Smoker', 'Current Smoker'].map((v) => <option key={v}>{v}</option>)}
                      {key === 'APOE_ε4' && ['Positive', 'Negative'].map((v) => <option key={v}>{v}</option>)}
                      {key === 'Physical_Activity' && ['Sedentary', 'Mild Activity', 'Moderate Activity'].map((v) => <option key={v}>{v}</option>)}
                      {key === 'Depression_Status' && ['Yes', 'No'].map((v) => <option key={v}>{v}</option>)}
                      {key === 'Medication_History' && ['Yes', 'No'].map((v) => <option key={v}>{v}</option>)}
                      {key === 'Nutrition_Diet' && ['Balanced Diet', 'Low-Carb Diet', 'Mediterranean Diet'].map((v) => <option key={v}>{v}</option>)}
                      {key === 'Sleep_Quality' && ['Good', 'Poor'].map((v) => <option key={v}>{v}</option>)}
                      {key === 'Chronic_Health_Conditions' && ['None', 'Diabetes', 'Heart Disease', 'Hypertension'].map((v) => <option key={v}>{v}</option>)}
                    </select>
                  </label>
                ))}
                <button onClick={runPrediction} disabled={loading || !isFormValid} style={{ marginTop: 6, padding: '10px', background: loading || !isFormValid ? '#90a4ae' : '#004d99', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, cursor: loading || !isFormValid ? 'not-allowed' : 'pointer' }}>
                  {loading ? 'Analysing…' : 'Analyse risk'}
                </button>
              </div>
            </div>
          )}

          {/* ---- normal chat input ---- */}
          {!showForm && (
            <form onSubmit={handleChatSubmit} style={{ padding: '12px', borderTop: '1px solid #ddd', backgroundColor: 'white' }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder='Type "predict" or ask anything about dementia…'
                style={{ width: '100%', padding: '12px', borderRadius: 24, border: '1px solid #ccc', outline: 'none', fontSize: 14 }}
              />
            </form>
          )}
        </div>
      )}
    </>
  );
};

export default ChatbotWidget;