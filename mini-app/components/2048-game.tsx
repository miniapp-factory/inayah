"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Share } from "@/components/share";
import { url } from "@/lib/metadata";

const SIZE = 4;
const TILE_VALUES = [2, 4];
const TILE_PROBABILITIES = [0.9, 0.1];

function randomTile() {
  return Math.random() < TILE_PROBABILITIES[0] ? TILE_VALUES[0] : TILE_VALUES[1];
}

function emptyPositions(board: number[][]) {
  const positions: [number, number][] = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) positions.push([r, c]);
    }
  }
  return positions;
}

function addRandomTile(board: number[][]) {
  const positions = emptyPositions(board);
  if (positions.length === 0) return board;
  const [r, c] = positions[Math.floor(Math.random() * positions.length)];
  board[r][c] = randomTile();
  return board;
}

function initBoard() {
  const board = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  return addRandomTile(addRandomTile(board));
}

function transpose(board: number[][]) {
  return board[0].map((_, i) => board.map(row => row[i]));
}

function reverseRows(board: number[][]) {
  return board.map(row => [...row].reverse());
}

function slideAndMerge(row: number[]) {
  const filtered = row.filter(v => v !== 0);
  const merged: number[] = [];
  let skip = false;
  for (let i = 0; i < filtered.length; i++) {
    if (skip) {
      skip = false;
      continue;
    }
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      merged.push(filtered[i] * 2);
      skip = true;
    } else {
      merged.push(filtered[i]);
    }
  }
  while (merged.length < SIZE) merged.push(0);
  return merged;
}

function move(board: number[][], direction: "up" | "down" | "left" | "right") {
  let newBoard = board;
  if (direction === "up" || direction === "down") {
    newBoard = transpose(newBoard);
  }
  if (direction === "right" || direction === "down") {
    newBoard = reverseRows(newBoard);
  }
  newBoard = newBoard.map(row => slideAndMerge(row));
  if (direction === "right" || direction === "down") {
    newBoard = reverseRows(newBoard);
  }
  if (direction === "up" || direction === "down") {
    newBoard = transpose(newBoard);
  }
  return newBoard;
}

function boardsEqual(a: number[][], b: number[][]) {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (a[r][c] !== b[r][c]) return false;
    }
  }
  return true;
}

function canMove(board: number[][]) {
  if (emptyPositions(board).length > 0) return true;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE - 1; c++) {
      if (board[r][c] === board[r][c + 1]) return true;
    }
  }
  for (let c = 0; c < SIZE; c++) {
    for (let r = 0; r < SIZE - 1; r++) {
      if (board[r][c] === board[r + 1][c]) return true;
    }
  }
  return false;
}

export function Game2048() {
  const [board, setBoard] = useState<number[][]>(initBoard);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [history, setHistory] = useState<number[][][]>([]);
  const [leaderboard, setLeaderboard] = useState<number[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("2048-leaderboard");
    if (stored) {
      setLeaderboard(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    const newScore = board.flat().reduce((a, b) => a + b, 0);
    setScore(newScore);
    if (!canMove(board)) {
      setGameOver(true);
      // update leaderboard
      const updated = [...leaderboard, newScore].sort((a, b) => b - a).slice(0, 5);
      setLeaderboard(updated);
      localStorage.setItem("2048-leaderboard", JSON.stringify(updated));
    }
  }, [board, leaderboard]);

  const handleMove = (direction: "up" | "down" | "left" | "right") => {
    if (gameOver) return;
    // push current board to history for undo
    setHistory(prev => [...prev, board]);
    const newBoard = move(board, direction);
    if (!boardsEqual(board, newBoard)) {
      const boardWithTile = addRandomTile(newBoard);
      setBoard(boardWithTile);
    }
  };

  const undo = () => {
    if (history.length === 0) return;
    const prevBoard = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setBoard(prevBoard);
    setGameOver(false);
  };

  const restart = () => {
    setBoard(initBoard());
    setHistory([]);
    setGameOver(false);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="grid grid-cols-4 gap-2">
        {board.flat().map((value, idx) => (
          <div
            key={idx}
            className={`w-16 h-16 flex items-center justify-center rounded-md text-xl font-bold ${
              value === 0
                ? "bg-gray-200"
                : value <= 4
                ? "bg-yellow-200"
                : value <= 16
                ? "bg-yellow-300"
                : value <= 64
                ? "bg-yellow-400"
                : value <= 256
                ? "bg-yellow-500"
                : value <= 1024
                ? "bg-yellow-600"
                : "bg-yellow-700"
            }`}
          >
            {value !== 0 ? value : null}
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        <Button onClick={() => handleMove("up")}>↑</Button>
        <div className="flex gap-2">
          <Button onClick={() => handleMove("left")}>←</Button>
          <Button onClick={() => handleMove("right")}>→</Button>
        </div>
        <Button onClick={() => handleMove("down")}>↓</Button>
      </div>
      <div className="text-lg">Score: {score}</div>
      {gameOver && (
        <div className="flex flex-col items-center gap-2">
          <div className="text-xl font-bold">Game Over!</div>
          <Share text={`I scored ${score} points in 2048! ${url}`} />
        </div>
      )}
    </div>
  );
}
