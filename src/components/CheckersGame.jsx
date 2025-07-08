import React, { useState, useEffect } from 'react';

const CheckersGame = () => {
  const initializeBoard = () => {
    const board = Array(8).fill(null).map(() => Array(8).fill(null));
    
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) {
          board[row][col] = { color: 'black', isKing: false };
        }
      }
    }
    
    for (let row = 5; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) {
          board[row][col] = { color: 'white', isKing: false };
        }
      }
    }
    
    return board;
  };

  const [board, setBoard] = useState(initializeBoard());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState('white');
  const [gameStatus, setGameStatus] = useState('playing');
  const [aiAgentId, setAiAgentId] = useState(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [gameHistory, setGameHistory] = useState([]);
  const [apiCalls, setApiCalls] = useState([]);

  const logApiCall = (endpoint, method, data, response) => {
    const call = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      endpoint,
      method,
      data,
      response,
      success: response && !response.error
    };
    setApiCalls(prev => [call, ...prev.slice(0, 9)]);
  };

  useEffect(() => {
    const createAI = async () => {
      try {
        const requestData = {
          instructions: "You are a checkers AI opponent. When given a board state as an 8x8 grid, analyze the position and return your best move in the format 'from_row,from_col to to_row,to_col'. Consider captures, king promotions, and strategic positioning. Play as black pieces. Always respond with just the move format.",
          agent_name: "Checkers AI"
        };

        logApiCall('/create-agent', 'POST', requestData, 'Sending...');

        const response = await fetch('https://builder.impromptu-labs.com/api_tools/create-agent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer 4e31d5e989125dc49a09d234c59e85bc',
            'X-Generated-App-ID': '501e391c-cef5-462d-abf0-8a3429ff3e27'
          },
          body: JSON.stringify(requestData)
        });
        
        const data = await response.json();
        logApiCall('/create-agent', 'POST', requestData, data);
        
        if (data.agent_id) {
          setAiAgentId(data.agent_id);
        }
      } catch (error) {
        console.error('Failed to create AI agent:', error);
        logApiCall('/create-agent', 'POST', requestData, { error: error.message });
      }
    };
    
    createAI();
  }, []);

  const getValidMoves = (row, col, board) => {
    const piece = board[row][col];
    if (!piece) return [];
    
    const moves = [];
    const directions = piece.isKing ? 
      [[-1, -1], [-1, 1], [1, -1], [1, 1]] : 
      piece.color === 'white' ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]];
    
    directions.forEach(([dRow, dCol]) => {
      const newRow = row + dRow;
      const newCol = col + dCol;
      
      if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
        if (!board[newRow][newCol]) {
          moves.push({ row: newRow, col: newCol, isCapture: false });
        } else if (board[newRow][newCol].color !== piece.color) {
          const jumpRow = newRow + dRow;
          const jumpCol = newCol + dCol;
          if (jumpRow >= 0 && jumpRow < 8 && jumpCol >= 0 && jumpCol < 8 && !board[jumpRow][jumpCol]) {
            moves.push({ row: jumpRow, col: jumpCol, isCapture: true, capturedRow: newRow, capturedCol: newCol });
          }
        }
      }
    });
    
    return moves;
  };

  const makeMove = (fromRow, fromCol, toRow, toCol, capturedRow = null, capturedCol = null) => {
    const newBoard = board.map(row => [...row]);
    const piece = newBoard[fromRow][fromCol];
    
    newBoard[toRow][toCol] = piece;
    newBoard[fromRow][fromCol] = null;
    
    if (capturedRow !== null && capturedCol !== null) {
      newBoard[capturedRow][capturedCol] = null;
    }
    
    if ((piece.color === 'white' && toRow === 0) || (piece.color === 'black' && toRow === 7)) {
      newBoard[toRow][toCol].isKing = true;
    }
    
    const moveRecord = {
      from: [fromRow, fromCol],
      to: [toRow, toCol],
      captured: capturedRow !== null ? [capturedRow, capturedCol] : null,
      player: piece.color,
      timestamp: new Date().toISOString()
    };
    
    setGameHistory(prev => [...prev, moveRecord]);
    
    return newBoard;
  };

  const handleSquareClick = (row, col) => {
    if (currentPlayer !== 'white' || gameStatus !== 'playing' || isAiThinking) return;
    
    if (selectedSquare) {
      const validMoves = getValidMoves(selectedSquare.row, selectedSquare.col, board);
      const move = validMoves.find(m => m.row === row && m.col === col);
      
      if (move) {
        const newBoard = makeMove(
          selectedSquare.row, 
          selectedSquare.col, 
          row, 
          col, 
          move.capturedRow, 
          move.capturedCol
        );
        setBoard(newBoard);
        setSelectedSquare(null);
        setCurrentPlayer('black');
      } else {
        setSelectedSquare(null);
      }
    } else if (board[row][col] && board[row][col].color === 'white') {
      setSelectedSquare({ row, col });
    }
  };

  useEffect(() => {
    if (currentPlayer === 'black' && aiAgentId && gameStatus === 'playing') {
      const makeAIMove = async () => {
        setIsAiThinking(true);
        try {
          const boardString = board.map((row, r) => 
            row.map((cell, c) => {
              if (!cell) return '.';
              return cell.color === 'black' ? (cell.isKing ? 'B' : 'b') : (cell.isKing ? 'W' : 'w');
            }).join('')
          ).join('\n');
          
          const requestData = {
            agent_id: aiAgentId,
            message: `Current board state (b=black piece, B=black king, w=white piece, W=white king, .=empty):\n${boardString}\n\nMake your move as black. Return only the move in format: from_row,from_col to to_row,to_col`
          };

          logApiCall('/chat', 'POST', requestData, 'Sending...');
          
          const response = await fetch('https://builder.impromptu-labs.com/api_tools/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer 4e31d5e989125dc49a09d234c59e85bc',
              'X-Generated-App-ID': '501e391c-cef5-462d-abf0-8a3429ff3e27'
            },
            body: JSON.stringify(requestData)
          });
          
          const data = await response.json();
          logApiCall('/chat', 'POST', requestData, data);
          
          const moveMatch = data.response?.match(/(\d),(\d) to (\d),(\d)/);
          
          if (moveMatch) {
            const [, fromRow, fromCol, toRow, toCol] = moveMatch.map(Number);
            const validMoves = getValidMoves(fromRow, fromCol, board);
            const move = validMoves.find(m => m.row === toRow && m.col === toCol);
            
            if (move) {
              const newBoard = makeMove(fromRow, fromCol, toRow, toCol, move.capturedRow, move.capturedCol);
              setBoard(newBoard);
              setCurrentPlayer('white');
            }
          }
        } catch (error) {
          console.error('AI move failed:', error);
          logApiCall('/chat', 'POST', {}, { error: error.message });
          setCurrentPlayer('white');
        } finally {
          setIsAiThinking(false);
        }
      };
      
      setTimeout(makeAIMove, 1000);
    }
  }, [currentPlayer, aiAgentId, board, gameStatus]);

  const resetGame = () => {
    setBoard(initializeBoard());
    setSelectedSquare(null);
    setCurrentPlayer('white');
    setGameStatus('playing');
    setGameHistory([]);
    setIsAiThinking(false);
  };

  const getValidMovesForSelected = () => {
    if (!selectedSquare) return [];
    return getValidMoves(selectedSquare.row, selectedSquare.col, board);
  };

  const validMoves = getValidMovesForSelected();

  return (
    <div className="space-y-6">
      {/* Game Status Card */}
      <div className="card">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Game Status
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-lg text-gray-700 dark:text-gray-300">
                Current Player: 
              </span>
              <span className={`font-semibold ${
                currentPlayer === 'white' ? 'text-gray-800 dark:text-gray-200' : 'text-gray-600 dark:text-gray-400'
              }`}>
                {currentPlayer === 'white' ? 'You (White)' : 'AI (Black)'}
              </span>
              {isAiThinking && (
                <div className="flex items-center gap-2 ml-2">
                  <div className="spinner"></div>
                  <span className="text-sm text-primary-600 dark:text-primary-400">
                    AI is thinking...
                  </span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={resetGame}
            className="btn-secondary"
            aria-label="Reset game"
          >
            Reset Game
          </button>
        </div>
      </div>

      {/* Game Board */}
      <div className="card">
        <div className="flex justify-center">
          <div className="inline-block border-4 border-gray-800 dark:border-gray-600 rounded-lg overflow-hidden">
            <div className="grid grid-cols-8 gap-0">
              {board.map((row, rowIndex) =>
                row.map((cell, colIndex) => {
                  const isBlackSquare = (rowIndex + colIndex) % 2 === 1;
                  const isSelected = selectedSquare && selectedSquare.row === rowIndex && selectedSquare.col === colIndex;
                  const isValidMove = validMoves.some(move => move.row === rowIndex && move.col === colIndex);
                  
                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      onClick={() => handleSquareClick(rowIndex, colIndex)}
                      className={`
                        w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center cursor-pointer relative
                        transition-all duration-200 hover:brightness-110
                        ${isBlackSquare 
                          ? 'bg-gray-600 dark:bg-gray-700' 
                          : 'bg-gray-300 dark:bg-gray-400'
                        }
                        ${isSelected ? 'ring-4 ring-primary-500 ring-inset' : ''}
                        ${isValidMove ? 'ring-2 ring-green-400 ring-inset' : ''}
                      `}
                      role="button"
                      tabIndex={0}
                      aria-label={`Square ${rowIndex}-${colIndex}${cell ? ` with ${cell.color} ${cell.isKing ? 'king' : 'piece'}` : ''}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleSquareClick(rowIndex, colIndex);
                        }
                      }}
                    >
                      {cell && (
                        <div className={`
                          w-8 h-8 sm:w-12 sm:h-12 rounded-full border-2 flex items-center justify-center
                          transition-transform duration-200 hover:scale-110
                          ${cell.color === 'white' 
                            ? 'bg-gray-100 border-gray-400 text-gray-800' 
                            : 'bg-gray-800 border-gray-600 text-gray-200'
                          }
                        `}>
                          {cell.isKing && (
                            <span className="text-lg sm:text-xl font-bold">♔</span>
                          )}
                        </div>
                      )}
                      {isValidMove && !cell && (
                        <div className="w-3 h-3 bg-green-400 rounded-full opacity-70"></div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          How to Play
        </h3>
        <div className="space-y-2 text-gray-700 dark:text-gray-300">
          <p>• Click on your white pieces to select them</p>
          <p>• Valid moves will be highlighted in green</p>
          <p>• Capture opponent pieces by jumping over them</p>
          <p>• Reach the opposite end to become a king (♔)</p>
          <p>• Kings can move in all diagonal directions</p>
        </div>
      </div>

      {/* Move History */}
      {gameHistory.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Move History
          </h3>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {gameHistory.slice(-10).map((move, index) => (
              <div key={index} className="text-sm text-gray-600 dark:text-gray-400">
                {move.player === 'white' ? 'You' : 'AI'}: 
                ({move.from[0]},{move.from[1]}) → ({move.to[0]},{move.to[1]})
                {move.captured && ' (captured)'}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckersGame;
