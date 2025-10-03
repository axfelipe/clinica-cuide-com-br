import React, { useState } from 'react'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('kiosk')

  return (
    <div className="App">
      <nav className="navbar">
        <div className="nav-brand">
          <h1>🏥 Cuide.com.br</h1>
        </div>
        <div className="nav-links">
          <button 
            onClick={() => setCurrentPage('kiosk')}
            className={currentPage === 'kiosk' ? 'active' : ''}
          >
            Kiosk
          </button>
          <button 
            onClick={() => setCurrentPage('painel')}
            className={currentPage === 'painel' ? 'active' : ''}
          >
            Painel TV
          </button>
        </div>
      </nav>

      <main className="main-content">
        {currentPage === 'kiosk' && (
          <div className="kiosk-page">
            <div className="kiosk-container">
              <h2>Emissão de Senhas</h2>
              <div className="ticket-options">
                <button className="ticket-btn consulta">
                  🩺 Consulta
                </button>
                <button className="ticket-btn exames">
                  🧪 Exames
                </button>
                <button className="ticket-btn prioridade">
                  ⚠️ Prioridade
                </button>
              </div>
              <div className="message">
                ✅ Frontend React funcionando!
              </div>
            </div>
          </div>
        )}

        {currentPage === 'painel' && (
          <div className="painel-page">
            <div className="painel-container">
              <h2>Painel de Atendimento</h2>
              <div className="chamada-atual">
                <div className="senha">C001</div>
                <div className="guiche">Guichê 1</div>
              </div>
              <div className="ultimas-chamadas">
                <p>P002 - Guichê 2</p>
                <p>E001 - Guichê 3</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App