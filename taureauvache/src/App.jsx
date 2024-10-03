import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Chat from './Chat'; // Import Chat component

const socket = io('https://taureauvache.onrender.com/'); // Connect to the backend

export default function Component() {
  const [secretNumber, setSecretNumber] = useState('');
  const [currentGuess, setCurrentGuess] = useState('');
  const [guesses, setGuesses] = useState([]);
  const [gameWon, setGameWon] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [opponentSecretNumber, setOpponentSecretNumber] = useState('');
  const [opponentGuess, setOpponentGuess] = useState(null);
  const [isMyTurn, setIsMyTurn] = useState(false);

  useEffect(() => {
    socket.on('startGame', ({ opponent, opponentSecret }) => {
      setWaitingForOpponent(false);
      setOpponentSecretNumber(opponentSecret);
      setGameStarted(true);
      console.log('Game started against opponent:', opponent);
    });

    socket.on('waiting', (message) => {
      setWaitingForOpponent(true);
      console.log(message);
    });

    socket.on('opponentGuess', (guess) => {
      setOpponentGuess(guess);
      console.log('Opponent guessed:', guess);
    });

    socket.on('yourTurn', (turnStatus) => {
      setIsMyTurn(turnStatus);
    });

    return () => {
      socket.off('startGame');
      socket.off('waiting');
      socket.off('opponentGuess');
      socket.off('yourTurn');
    };
  }, []);

  function hasUniqueDigits(number) {
    return new Set(number).size === number.length;
  }

  function handleStartGame() {
    if (
      secretNumber.length !== 4 ||
      !/^\d+$/.test(secretNumber) ||
      secretNumber[0] === '0' ||
      !hasUniqueDigits(secretNumber)
    ) {
      alert("Please enter a valid 4-digit number that doesn't start with 0 and has no repeated digits.");
      return;
    }
    socket.emit('playRound', secretNumber);
    setGameStarted(true);
  }

  function handleGuess() {
    if (
      currentGuess.length !== 4 ||
      !/^\d+$/.test(currentGuess) ||
      currentGuess[0] === '0' ||
      !hasUniqueDigits(currentGuess)
    ) {
      alert("Please enter a 4-digit number that doesn't start with 0 and has no repeated digits.");
      return;
    }

    socket.emit('guess', currentGuess);

    const bulls = opponentSecretNumber
      .split('')
      .filter((digit, index) => digit === currentGuess[index]).length;
    const cows = opponentSecretNumber.split('').filter((digit) => currentGuess.includes(digit)).length - bulls;

    const newGuess = { number: currentGuess, bulls, cows };
    setGuesses([newGuess, ...guesses]);
    setCurrentGuess('');

    if (bulls === 4) {
      setGameWon(true);
    }
  }

  function resetGame() {
    setSecretNumber('');
    setCurrentGuess('');
    setGuesses([]);
    setGameWon(false);
    setGameStarted(false);
    setOpponentSecretNumber('');
    setOpponentGuess(null);
  }

  return (
    <div className="container">
      <Chat socket={socket} /> {/* Include Chat component */}
      <div className="card">
        <div className="card-header">
          <h1>Taureau Vache</h1>
        </div>
        <div className="card-body">
          {!gameStarted ? (
            <div className="input-container">
              <input
                type="text"
                value={secretNumber}
                onChange={(e) => setSecretNumber(e.target.value)}
                placeholder="Enter 4-digit secret number"
                maxLength={4}
                className="input"
              />
              <button onClick={handleStartGame} className="guess-button">
                Start Game
              </button>
            </div>
          ) : (
            <>
              {waitingForOpponent ? (
                <p className="waiting-message">Waiting for an opponent to join...</p>
              ) : (
                <>
                  <p className="description">
                    Guess your opponent's 4-digit number. Bulls (🐂) are correct digits in the right position. 
                    Cows (🐄) are correct digits in the wrong position.
                  </p>
                  <div className="input-container">
                    <input
                      type="text"
                      value={currentGuess}
                      onChange={(e) => setCurrentGuess(e.target.value)}
                      placeholder="Enter 4-digit number"
                      maxLength={4}
                      className="input"
                      disabled={!isMyTurn || gameWon}
                    />
                    <button onClick={handleGuess} disabled={!isMyTurn || gameWon} className="guess-button">
                      Guess
                    </button>
                  </div>
                  {!isMyTurn && !gameWon && (
                    <p className="waiting-turn-message">Waiting for your opponent's turn...</p>
                  )}
                  <div className="new-game">
                    <button onClick={resetGame} className="reset-button">New Game</button>
                  </div>
                  <div className="guess-list">
                    {gameWon && (
                      <p className="game-won-message">Congratulations! You've won!</p>
                    )}
                    {guesses.map((guess, index) => (
                      <div key={index} className="guess-item">
                        <span className="guess-number">{guess.number}</span>
                        <span className="guess-result">
                          🐂 <span className="bulls">{guess.bulls}</span> 
                          {' '}🐄 <span className="cows">{guess.cows}</span>
                        </span>
                      </div>
                    ))}
                    {opponentGuess && (
                      <div className="opponent-guess">
                        <p>Your opponent guessed: {opponentGuess}</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
