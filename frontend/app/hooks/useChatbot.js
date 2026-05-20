'use client';

import { useState, useCallback, useRef } from 'react';

const CONTACT_TRIGGER_PHRASES = [
  'contactez directement notre responsable',
  'nour.chaabouni@medianet.com.tn',
];

const FALLBACK_MESSAGE =
  "Je rencontre une difficulté de connexion. Réessayez dans quelques instants ou contactez-nous directement à incubateur@medianet.tn.";

// ─── Hard-coded instant answers for the 4 quick-reply buttons ────────────
// Mistral 7B is unreliable at following long system prompts for short
// one-word queries. We intercept these client-side so they never hit Ollama.
const INSTANT_ANSWERS = {
  'candidater': {
    text: 'Pour candidater :\n1) Créez votre compte sur la plateforme\n2) Choisissez un programme actif ou soumettez une candidature spontanée\n3) Remplissez le dossier en ligne\n4) Suivez votre statut en temps réel depuis votre tableau de bord.\n\nNotre équipe vous répond sous 48h.',
    isContact: false,
  },
  'financement': {
    text: 'MEDIANET Incubator propose un financement entre **10 000 DT** et **150 000 DT** selon le stade de votre startup et le programme sélectionné, en partenariat avec Africinvest Group.',
    isContact: false,
  },
  'programmes': {
    text: 'Nos programmes actifs couvrent **FinTech**, **EdTech**, **AgriTech**, **HealthTech**, **CleanTech**, **AI/ML** et **e-commerce tech**.\n\nDurée : 6 à 12 mois avec mentorat dédié, 25 experts et 22 formations. Les candidatures sont ouvertes — consultez la liste complète sur la plateforme.',
    isContact: false,
  },
  'contact': {
    text: 'Voici comment nous joindre :\n\n👤 Nour Chaabouni\n📧 nour.chaabouni@medianet.com.tn\n📍 Startup Village, Menzah, Tunis\n🕐 Lundi–vendredi, 8h–17h',
    isContact: true,
  },
};

function hasContactBlock(text) {
  const lower = text.toLowerCase();
  return CONTACT_TRIGGER_PHRASES.every((phrase) => lower.includes(phrase));
}

export function useChatbot({ apiUrl = '/api/ai/chat' } = {}) {
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: "Bonjour 👋 Je suis l'assistant IA de MEDIANET Incubator. Comment puis-je vous aider ?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const historyRef = useRef([]);
  const esRef      = useRef(null);

  const send = useCallback(
    (override) => {
      const text = (override ?? input).trim();
      if (!text || isStreaming) return;

      esRef.current?.close();
      esRef.current = null;

      // ── Instant answer: bypass Ollama for known quick-reply keywords ──
      const key = text.toLowerCase().trim();
      if (INSTANT_ANSWERS[key]) {
        const { text: answerText, isContact } = INSTANT_ANSWERS[key];
        setMessages((prev) => [
          ...prev,
          { role: 'user', text },
          { role: 'bot', text: answerText, isContact },
        ]);
        setInput('');
        historyRef.current = [
          ...historyRef.current,
          { role: 'user', content: text },
          { role: 'assistant', content: answerText },
        ];
        return;
      }

      // ── Normal flow: stream from Ollama ───────────────────────────────
      setMessages((prev) => [...prev, { role: 'user', text }]);
      setInput('');
      setIsStreaming(true);
      setMessages((prev) => [...prev, { role: 'bot', text: '', isStreaming: true }]);

      const historyParam = encodeURIComponent(
        JSON.stringify(historyRef.current.slice(-10))
      );
      const url = `${apiUrl}?message=${encodeURIComponent(text)}&history=${historyParam}`;

      const es = new EventSource(url);
      esRef.current = es;
      let accumulated = '';

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.error) {
            es.close();
            setIsStreaming(false);
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last?.isStreaming) {
                next[next.length - 1] = { role: 'bot', text: data.error, isError: true, isStreaming: false };
              }
              return next;
            });
            return;
          }

          if (data.token) {
            accumulated += data.token;
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last?.isStreaming) {
                next[next.length - 1] = { ...last, text: accumulated };
              }
              return next;
            });
          }

          if (data.done) {
            es.close();
            esRef.current = null;
            setIsStreaming(false);

            const finalText = accumulated.replace(/^Assistant:\s*/i, '').trim();
            const isContact = hasContactBlock(finalText);

            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last?.isStreaming) {
                next[next.length - 1] = { role: 'bot', text: finalText, isStreaming: false, isContact };
              }
              return next;
            });

            historyRef.current = [
              ...historyRef.current,
              { role: 'user', content: text },
              { role: 'assistant', content: finalText },
            ];
          }
        } catch {
          // keepalive ping — ignore
        }
      };

      es.onerror = () => {
        es.close();
        esRef.current = null;
        setIsStreaming(false);
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last?.isStreaming) {
            next[next.length - 1] = {
              role: 'bot',
              text: accumulated || FALLBACK_MESSAGE,
              isStreaming: false,
              isError: !accumulated,
            };
          }
          return next;
        });
      };
    },
    [input, isStreaming, apiUrl]
  );

  const escalate = useCallback(() => {
    setMessages((prev) => [
      ...prev,
      {
        role: 'bot',
        text:
          'Bien sûr ! Voici comment joindre directement notre responsable :\n\n' +
          '👤 Nour Chaabouni\n' +
          '📧 nour.chaabouni@medianet.com.tn\n' +
          '🕐 Disponible lundi–vendredi, 8h–17h',
        isContact: true,
      },
    ]);
  }, []);

  const reset = useCallback(() => {
    esRef.current?.close();
    esRef.current = null;
    historyRef.current = [];
    setIsStreaming(false);
    setInput('');
    setMessages([
      {
        role: 'bot',
        text: "Bonjour 👋 Je suis l'assistant IA de MEDIANET Incubator. Comment puis-je vous aider ?",
      },
    ]);
  }, []);

  return { messages, input, setInput, isStreaming, send, escalate, reset };
}