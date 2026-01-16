import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, Settings, User, Bot, Loader2, AlertCircle, MessageSquare, Mic, Play } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  error?: boolean;
}

interface VoiceModel {
  id: string;
  name: string;
  gender: string;
  language: string;
  country: string;
  path: string;
  quality: string;
  description?: string;
}

const App = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'tts'>('tts');
  const [url, setUrl] = useState('');
  const [llamaEndpoint, setLlamaEndpoint] = useState('http://localhost:10000');
  const [ttsEndpoint, setTtsEndpoint] = useState('http://127.0.0.1:8000');
  const [showSettings, setShowSettings] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // TTS State
  const [ttsText, setTtsText] = useState('');
  const [ttsModel, setTtsModel] = useState('');
  const [isGeneratingTTS, setIsGeneratingTTS] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [ttsError, setTtsError] = useState('');
  const [voiceModels, setVoiceModels] = useState<VoiceModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchVoiceModels = async () => {
    setIsLoadingModels(true);
    setTtsError('');
    try {
      const response = await fetch(`${ttsEndpoint}/models`);
      if (!response.ok) {
        throw new Error('Failed to fetch voice models');
      }
      const models = await response.json();
      setVoiceModels(models);
      if (models.length > 0 && !ttsModel) {
        setTtsModel(models[0].id);
      }
    } catch (err: any) {
      setTtsError(`Failed to load voice models: ${err.message}`);
      console.error('Error fetching voice models:', err);
    } finally {
      setIsLoadingModels(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'tts') {
      fetchVoiceModels();
    }
  }, [activeTab, ttsEndpoint]);

  const handleStreamingResponse = async (response: Response, updateMessage: (content: string) => void) => {
    if (!response.body) return;
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulatedContent = '';
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep the last partial line in the buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                accumulatedContent += delta;
                updateMessage(accumulatedContent);
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
    return accumulatedContent;
  };

  const processArticle = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!url.trim() || isLoading) return;

    const currentUrl = url;
    setUrl(''); // Clear input
    setIsLoading(true);

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: currentUrl }]);

    // Helper to add/update assistant message
    const addAssistantMessage = () => {
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      return messages.length + 1; // Index of new message
    };

    const updateAssistantMessage = (content: string) => {
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMsg = newMessages[newMessages.length - 1];
        if (lastMsg.role === 'assistant') {
          lastMsg.content = content;
        }
        return newMessages;
      });
    };

    try {
      // 1. Fetch Blog Content
      // We'll show a temporary "Thinking..." state or just let the empty message sit there until streaming starts?
      // Better to have a temporary internal state or just update the last message text.

      // Let's add the empty assistant message now to show loading state in UI
      addAssistantMessage();

      let content = '';
      let title = 'Blog Post';

      // Fetching logic (reused)
      const proxies = [
        `https://api.allorigins.win/raw?url=${encodeURIComponent(currentUrl)}`,
        `https://corsproxy.io/?${encodeURIComponent(currentUrl)}`,
        `https://cors-anywhere.herokuapp.com/${currentUrl}`
      ];

      let fetchData = null;
      for (const proxy of proxies) {
        try {
          const response = await fetch(proxy);
          if (response.ok) {
            fetchData = await response.text();
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!fetchData) {
        throw new Error('Could not fetch URL. Please ensure the URL is accessible.');
      }

      const parser = new DOMParser();
      const doc = parser.parseFromString(fetchData, 'text/html');
      const article = doc.querySelector('article') || doc.querySelector('main') || doc.querySelector('.post-content') || doc.body;
      title = doc.querySelector('h1')?.textContent?.trim() || doc.title || 'Untitled';

      // Extract text
      article.querySelectorAll('p, h2, h3, h4, ul, ol, li').forEach(el => {
        const text = el.textContent?.trim();
        if (text && text.length > 20) {
          content += text + '\n\n';
        }
      });

      if (!content.trim() || content.length < 100) {
        throw new Error('Could not extract enough content.');
      }

      // 2. Call LLM with single prompt
      const prompt = `
You are an expert video content strategist.
Based on the following blog post, generate a comprehensive video packages containing:
1. A 30-60 second Video Script (with HOOK, POINTS, CTA).
2. 5-7 Detailed Image Prompts (for AI generators) visualizing scenes from the script.
3. 5-8 Relevant Hashtags for social media.

Presentation Format:
Please present the output in a clean Markdown format with headers for "Video Script", "Image Prompts", and "Hashtags". Do not separate into different JSON fields or blocks. Just one continuous response.

Blog Title: ${title}
Blog Content:
${content.substring(0, 15000)}
      `;

      const llamaResponse = await fetch(
        `${llamaEndpoint}/v1/chat/completions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'llama',
            messages: [
              { role: 'system', content: 'You are a helpful AI assistant specialized in converting text content into short-form video scripts.' },
              { role: 'user', content: prompt }
            ],
            stream: true, // Enable streaming
            temperature: 0.7,
            max_tokens: 4096
          })
        }
      );

      if (!llamaResponse.ok) {
        const errorData = await llamaResponse.json();
        throw new Error(`LLM Error: ${errorData.error?.message || 'Unknown error'}`);
      }

      // Stream the response
      await handleStreamingResponse(llamaResponse, updateAssistantMessage);

    } catch (err: any) {
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMsg = newMessages[newMessages.length - 1];
        if (lastMsg && lastMsg.role === 'assistant') {
          lastMsg.content = `Error: ${err.message}`;
          lastMsg.error = true;
        } else {
          // If we failed before creating assistant message
          newMessages.push({ role: 'assistant', content: `Error: ${err.message}`, error: true });
        }
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateSpeech = async () => {
    if (!ttsText.trim() || !ttsModel) return;

    setIsGeneratingTTS(true);
    setTtsError('');
    setAudioUrl(null);

    try {
      const response = await fetch(`${ttsEndpoint}/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: ttsText,
          model_id: ttsModel
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to generate speech');
      }

      const result = await response.json();

      // Fetch the generated audio file
      if (result.success && result.output_file) {
        // Get just the filename from the full path
        const filename = result.output_file.split('/').pop() || result.output_file.split('\\').pop();

        // Fetch the audio file from the server
        const audioResponse = await fetch(`${ttsEndpoint}/static/${filename}`);

        if (!audioResponse.ok) {
          throw new Error('Failed to load generated audio file');
        }

        const blob = await audioResponse.blob();
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      } else {
        throw new Error('Speech generation failed');
      }
    } catch (err: any) {
      setTtsError(err.message);
    } finally {
      setIsGeneratingTTS(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100 font-sans">
      {/* Settings Modal / Popover */}
      {showSettings && (
        <div className="absolute top-16 right-4 z-50 bg-gray-800 p-4 rounded-lg shadow-xl border border-gray-700 w-80 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2">Chat API Endpoint</label>
            <input
              type="text"
              value={llamaEndpoint}
              onChange={(e) => setLlamaEndpoint(e.target.value)}
              className="w-full bg-gray-900 text-white px-3 py-2 rounded border border-gray-700 text-sm focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2">TTS API Endpoint</label>
            <input
              type="text"
              value={ttsEndpoint}
              onChange={(e) => setTtsEndpoint(e.target.value)}
              className="w-full bg-gray-900 text-white px-3 py-2 rounded border border-gray-700 text-sm focus:border-blue-500 outline-none"
            />
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col border-b border-gray-800 bg-gray-900/95 backdrop-blur z-20">
        <div className="flex items-center justify-between p-4 pb-2">
          <div className="font-semibold text-lg flex items-center gap-2">
            Sumarizer <span className="text-xs bg-blue-600 px-2 py-0.5 rounded-full">v2</span>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition"
          >
            <Settings size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-4 gap-6 text-sm font-medium">
          <button
            onClick={() => setActiveTab('chat')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'chat' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
          >
            <MessageSquare size={16} />
            Chat / Summary
          </button>
          <button
            onClick={() => setActiveTab('tts')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'tts' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
          >
            <Mic size={16} />
            Text to Speech
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      {activeTab === 'chat' ? (
        <>
          <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 lg:p-8">
            <div className="max-w-3xl mx-auto space-y-6">

              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-[60vh] text-center opacity-50">
                  <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <Bot size={32} />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">How can I help you today?</h2>
                  <p>Paste a blog URL below to generate a script, prompts, and tags.</p>
                </div>
              )}

              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-4 ${msg.role === 'assistant' ? 'bg-transparent' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'assistant' ? 'bg-green-600' : 'bg-gray-600'}`}>
                    {msg.role === 'assistant' ? <Bot size={18} /> : <User size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-400 mb-1">
                      {msg.role === 'assistant' ? 'Summarizer' : 'You'}
                    </div>
                    {msg.error ? (
                      <div className="text-red-400 flex items-center gap-2 bg-red-900/20 p-3 rounded-md border border-red-500/20">
                        <AlertCircle size={16} />
                        {msg.content}
                      </div>
                    ) : (
                      <div className="prose prose-invert max-w-none text-sm leading-relaxed">
                        {msg.content ? (
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              code: ({ children }) => <span className="bg-gray-800 px-1 py-0.5 rounded text-blue-300 font-mono text-xs">{children}</span>,
                              pre: ({ children }) => <pre className="bg-gray-800 p-3 rounded-lg overflow-x-auto my-2 text-xs">{children}</pre>,
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        ) : (
                          <div className="flex items-center gap-2 text-gray-500 italic">
                            <Loader2 className="animate-spin" size={14} />
                            Thinking...
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </main>

          {/* Input Area */}
          <footer className="p-4 bg-gray-900 border-t border-gray-800">
            <div className="max-w-3xl mx-auto">
              <form onSubmit={processArticle} className="relative">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Paste blog URL here..."
                  disabled={isLoading}
                  className="w-full bg-gray-800 text-white pl-4 pr-12 py-3.5 rounded-xl border border-gray-700/50 focus:border-gray-600 focus:ring-1 focus:ring-gray-600 outline-none transition-all placeholder:text-gray-500 shadow-lg"
                />
                <button
                  type="submit"
                  disabled={!url.trim() || isLoading}
                  className={`absolute right-2 top-2 p-1.5 rounded-lg transition-all ${url.trim() && !isLoading
                    ? 'bg-white text-gray-900 hover:bg-gray-200'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                >
                  <Send size={18} />
                </button>
              </form>
              <div className="text-center mt-2 text-xs text-gray-500">
                Sumarizer can make mistakes. Consider checking important information.
              </div>
            </div>
          </footer>
        </>
      ) : (
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-2xl mx-auto space-y-8 mt-4">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white">Text to Speech</h2>
              <p className="text-gray-400">Convert your text into lifelike audio using the configured TTS model.</p>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Voice Model</span>
                    {isLoadingModels && (
                      <span className="text-xs flex items-center gap-1 text-blue-400">
                        <Loader2 className="animate-spin" size={12} />
                        Loading models...
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <select
                      value={ttsModel}
                      onChange={(e) => setTtsModel(e.target.value)}
                      disabled={isLoadingModels || voiceModels.length === 0}
                      className="w-full bg-gray-900 text-white px-4 py-3 rounded-xl border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none appearance-none disabled:opacity-50"
                    >
                      {voiceModels.length === 0 ? (
                        <option value="">No models available</option>
                      ) : (
                        voiceModels.map(model => (
                          <option key={model.id} value={model.id}>
                            {model.name} ({model.gender}, {model.language}_{model.country}, {model.quality})
                          </option>
                        ))
                      )}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                    </div>
                  </div>
                  {voiceModels.find(m => m.id === ttsModel)?.description && (
                    <p className="text-xs text-gray-500 mt-1">
                      {voiceModels.find(m => m.id === ttsModel)?.description}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Input Text</label>
                  <textarea
                    value={ttsText}
                    onChange={(e) => setTtsText(e.target.value)}
                    placeholder="Enter text to convert to speech..."
                    className="w-full h-40 bg-gray-900 text-white p-4 rounded-xl border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none placeholder:text-gray-600"
                  />
                </div>

                <button
                  onClick={generateSpeech}
                  disabled={isGeneratingTTS || !ttsText.trim() || !ttsModel || voiceModels.length === 0}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3.5 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                >
                  {isGeneratingTTS ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Generating Audio...
                    </>
                  ) : (
                    <>
                      <Play size={20} fill="currentColor" />
                      Generate Audio
                    </>
                  )}
                </button>

                {ttsError && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 text-red-400">
                    <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                    <div className="text-sm">{ttsError}</div>
                  </div>
                )}

                {audioUrl && (
                  <div className="mt-6 p-4 bg-gray-900 rounded-xl border border-gray-700 animate-in fade-in slide-in-from-top-4">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Preview</label>
                    <audio controls className="w-full h-12 rounded-lg" src={audioUrl}>
                      Your browser does not support the audio element.
                    </audio>
                    <div className="flex justify-end mt-2">
                      <a
                        href={audioUrl}
                        download={`speech-${Date.now()}.mp3`}
                        className="text-xs text-blue-400 hover:text-blue-300 hover:underline"
                      >
                        Download Audio
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}

export default App;
