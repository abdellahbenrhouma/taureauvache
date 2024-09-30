import { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:3000'); // Connect to the backend

export default function Component() {
  const [secretNumber, setSecretNumber] = useState('');
  const [currentGuess, setCurrentGuess] = useState('');
  const [guesses, setGuesses] = useState([]);
  const [gameWon, setGameWon] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [opponentSecretNumber, setOpponentSecretNumber] = useState(''); // Store opponent's secret number
  const [opponentGuess, setOpponentGuess] = useState(null);
  const [isMyTurn, setIsMyTurn] = useState(false); // Track if it's this player's turn

  useEffect(() => {
    socket.on('startGame', ({ opponent, opponentSecret }) => {
      setWaitingForOpponent(false);
      setOpponentSecretNumber(opponentSecret); // Store opponent's secret number
      setGameStarted(true);
      console.log('Game started against opponent:', opponent);
    });

    socket.on('waiting', (message) => {
      setWaitingForOpponent(true);
      console.log(message);
    });

    socket.on('opponentGuess', (guess) => {
      setOpponentGuess(guess); // Handle opponent's guess
      console.log('Opponent guessed:', guess);
    });

    socket.on('yourTurn', (turnStatus) => {
      setIsMyTurn(turnStatus); // Update turn status
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
      secretNumber[0] === '0' ||  // Check that it doesn't start with 0
      !hasUniqueDigits(secretNumber)  // Check for unique digits
    ) {
      alert(
        "Please enter a valid 4-digit number that doesn't start with 0 and has no repeated digits."
      );
      return;
    }
    socket.emit('playRound', secretNumber); // Send player's secret number to server
    setGameStarted(true);
  }

  function handleGuess() {
    if (
      currentGuess.length !== 4 ||
      !/^\d+$/.test(currentGuess) ||
      currentGuess[0] === '0' ||  // Check that guess doesn't start with 0
      !hasUniqueDigits(currentGuess)  // Check for unique digits in guess
    ) {
      alert(
        "Please enter a 4-digit number that doesn't start with 0 and has no repeated digits."
      );
      return;
    }

    socket.emit('guess', currentGuess); // Send the guess to the opponent

    const bulls = opponentSecretNumber
      .split('')
      .filter((digit, index) => digit === currentGuess[index]).length;
    const cows =
      opponentSecretNumber.split('').filter((digit) => currentGuess.includes(digit))
        .length - bulls;

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
                <p className="waiting-message">
                  Waiting for an opponent to join...
                </p>
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
                      disabled={!isMyTurn || gameWon} // Disable input if it's not player's turn or if the game is won
                    />
                    <button 
                      onClick={handleGuess} 
                      disabled={!isMyTurn || gameWon} 
                      className="guess-button"
                    >
                      Guess
                    </button>
                  </div>
                  {!isMyTurn && !gameWon && (
                    <p className="waiting-turn-message">Waiting for your opponent's turn...</p>
                  )}
                  <div className="new-game">
                    <button onClick={resetGame} className="reset-button">
                      New Game
                    </button>
                  </div>
                  <div className="guess-list">
                    {gameWon && (
                      <p className="game-won-message">
                        Congratulations! You've won!
                      </p>
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
