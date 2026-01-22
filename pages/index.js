import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'

export default function Home() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [response, setResponse] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [error, setError] = useState('')

  const recognitionRef = useRef(null)
  const synthesisRef = useRef(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const SpeechSynthesis = window.speechSynthesis

      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = 'en-US'

        recognitionRef.current.onresult = (event) => {
          const current = event.resultIndex
          const transcriptText = event.results[current][0].transcript

          if (event.results[current].isFinal) {
            setTranscript(transcriptText)
            processCommand(transcriptText)
          }
        }

        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error)
          setError(`Recognition error: ${event.error}`)
          setIsListening(false)
        }

        recognitionRef.current.onend = () => {
          if (isListening) {
            recognitionRef.current.start()
          }
        }
      } else {
        setError('Speech recognition not supported in this browser')
      }

      synthesisRef.current = SpeechSynthesis
    }
  }, [])

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    } else {
      setError('')
      recognitionRef.current?.start()
      setIsListening(true)
      speak("I'm listening. What would you like me to search for?")
    }
  }

  const speak = (text) => {
    if (synthesisRef.current) {
      synthesisRef.current.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.volume = 1.0

      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)

      synthesisRef.current.speak(utterance)
    }
  }

  const processCommand = async (command) => {
    const lowerCommand = command.toLowerCase()

    if (lowerCommand.includes('search') || lowerCommand.includes('google') || lowerCommand.includes('find') || lowerCommand.includes('look up')) {
      const searchQuery = command
        .replace(/search for/gi, '')
        .replace(/search/gi, '')
        .replace(/google/gi, '')
        .replace(/find/gi, '')
        .replace(/look up/gi, '')
        .trim()

      if (searchQuery) {
        performSearch(searchQuery)
      }
    } else {
      performSearch(command)
    }
  }

  const performSearch = (query) => {
    const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`

    const mockResults = [
      {
        title: `${query} - Wikipedia`,
        link: `https://en.wikipedia.org/wiki/${query.replace(/\s+/g, '_')}`,
        snippet: `Information about ${query} from Wikipedia...`
      },
      {
        title: `${query} - Official Website`,
        link: `https://www.example.com/${query.replace(/\s+/g, '-').toLowerCase()}`,
        snippet: `Official information and resources about ${query}...`
      },
      {
        title: `Learn about ${query}`,
        link: `https://www.example.org/learn/${query.replace(/\s+/g, '-').toLowerCase()}`,
        snippet: `Comprehensive guide and tutorials for ${query}...`
      }
    ]

    setSearchResults(mockResults)
    const responseText = `I found information about ${query}. Opening Google search results for you.`
    setResponse(responseText)
    speak(responseText)

    window.open(googleSearchUrl, '_blank')
  }

  return (
    <>
      <Head>
        <title>Voice Search Agent</title>
        <meta name="description" content="Personal voice-activated Google search agent" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="container">
        <div className="header">
          <h1>🎤 Voice Search Agent</h1>
          <p className="subtitle">Your personal AI assistant for voice-activated Google searches</p>
        </div>

        <div className="agent-container">
          <div className={`agent-circle ${isListening ? 'listening' : ''} ${isSpeaking ? 'speaking' : ''}`}>
            <div className="agent-icon">
              {isListening ? '🎤' : isSpeaking ? '🔊' : '🤖'}
            </div>
          </div>

          <button
            className={`listen-button ${isListening ? 'active' : ''}`}
            onClick={toggleListening}
          >
            {isListening ? 'Stop Listening' : 'Start Listening'}
          </button>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {transcript && (
            <div className="transcript-box">
              <strong>You said:</strong> {transcript}
            </div>
          )}

          {response && (
            <div className="response-box">
              <strong>Agent:</strong> {response}
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="results-container">
              <h2>Search Results</h2>
              {searchResults.map((result, index) => (
                <div key={index} className="result-item">
                  <a href={result.link} target="_blank" rel="noopener noreferrer">
                    <h3>{result.title}</h3>
                  </a>
                  <p className="result-snippet">{result.snippet}</p>
                  <span className="result-link">{result.link}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="instructions">
          <h3>How to use:</h3>
          <ul>
            <li>Click "Start Listening" to activate the agent</li>
            <li>Say "Search for [topic]" or "Google [topic]"</li>
            <li>Or just say what you want to search for</li>
            <li>The agent will open Google search results and speak to you</li>
          </ul>
        </div>
      </main>
    </>
  )
}
