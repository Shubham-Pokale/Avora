import { supabase } from './supabase.js';

const loginBtn = document.getElementById('login-btn');
const authSection = document.getElementById('auth-section');
const personaSection = document.getElementById('persona-section');
const chatSection = document.getElementById('chat-section');
const personaSelect = document.getElementById('persona-select');

async function signInWithProvider() {
  const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
  if (error) alert('Login error: ' + error.message);
}

loginBtn.addEventListener('click', signInWithProvider);

async function fetchPersonas() {
  try {
    const res = await fetch('http://localhost:8000/personas');
    const personas = await res.json();
    personaSelect.innerHTML = '';
    personas.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.toLowerCase().replace(/\s+/g, '_');
      opt.textContent = p;
      personaSelect.appendChild(opt);
    });
  } catch (e) {
    personaSelect.innerHTML = '<option>Error loading personas</option>';
  }
}

let socket = null;
let currentUser = null;
let currentPersona = null;

const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');

// Utility to render a message
function renderMessage(msg) {
  const div = document.createElement('div');
  div.className = 'p-2 rounded bg-secondary mb-1';
  div.textContent = `${msg.sender}: ${msg.text}`;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Fetch chat history (for MVP, just with a hardcoded peer)
async function fetchChatHistory() {
  // For MVP, use a hardcoded peer_id (simulate 1:1 chat)
  const peer_id = 'demo_peer';
  const user = await supabase.auth.getUser();
  currentUser = user.data.user;
  if (!currentUser) return;
  const res = await fetch(`http://localhost:8000/chat/history?user_id=${currentUser.id}&peer_id=${peer_id}`);
  const data = await res.json();
  chatMessages.innerHTML = '';
  data.messages.forEach(renderMessage);
}

// Connect to Socket.io
function connectSocket() {
  if (socket) return;
  socket = io('http://localhost:8000');
  socket.on('connect', () => {
    console.log('Connected to chat server');
  });
  socket.on('message', (msg) => {
    renderMessage(msg);
  });
}

// Send message handler
chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text || !currentUser) return;
  const peer_id = 'demo_peer';
  currentPersona = personaSelect.value;
  // Transform message via backend
  const resp = await fetch('http://localhost:8000/chat/transform', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, persona: currentPersona })
  });
  const { transformed } = await resp.json();
  const msg = {
    sender: currentUser.id,
    receiver: peer_id,
    text: transformed || text,
    persona: currentPersona,
    timestamp: new Date().toISOString()
  };
  // Send via Socket.io
  socket.emit('message', msg);
  // Persist to backend
  await fetch('http://localhost:8000/chat/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(msg)
  });
  chatInput.value = '';
});

// Update persona on change
personaSelect.addEventListener('change', (e) => {
  currentPersona = e.target.value;
});

// Enhance checkSession to fetch chat and connect socket
async function checkSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    authSection.classList.add('hidden');
    personaSection.classList.remove('hidden');
    chatSection.classList.remove('hidden');
    await fetchPersonas();
    await fetchChatHistory();
    connectSocket();
  } else {
    authSection.classList.remove('hidden');
    personaSection.classList.add('hidden');
    chatSection.classList.add('hidden');
    chatMessages.innerHTML = '';
    if (socket) { socket.disconnect(); socket = null; }
  }
}

// Listen for auth changes
supabase.auth.onAuthStateChange((_event, _session) => {
  checkSession();
});

// Initial check
checkSession(); 