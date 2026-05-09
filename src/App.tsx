import { StatusBar } from 'expo-status-bar';
import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, Dimensions,
  SafeAreaView,
} from 'react-native';

const { width } = Dimensions.get('window');
const SIZES = [3, 4, 5, 6];

function createBoard(size: number): boolean[][] {
  // Start all off, then do random valid moves to ensure solvable
  const board: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const minOn = Math.max(3, Math.floor(size * size * 0.3));
  let attempts = 0;
  do {
    // Reset board
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) board[r][c] = false;
    const moves = size * size;
    for (let i = 0; i < moves; i++) {
      const r = Math.floor(Math.random() * size);
      const c = Math.floor(Math.random() * size);
      toggleCell(board, r, c, size);
    }
    attempts++;
  } while ((board.every(row => row.every(cell => !cell)) || countOn(board) < minOn) && attempts < 50);
  // Final safety: ensure at least some lights on
  if (board.every(row => row.every(cell => !cell)) || countOn(board) < 3) {
    toggleCell(board, Math.floor(size / 2), Math.floor(size / 2), size);
  }
  return board;
}

function toggleCell(board: boolean[][], r: number, c: number, size: number) {
  board[r][c] = !board[r][c];
  if (r > 0) board[r-1][c] = !board[r-1][c];
  if (r < size-1) board[r+1][c] = !board[r+1][c];
  if (c > 0) board[r][c-1] = !board[r][c-1];
  if (c < size-1) board[r][c+1] = !board[r][c+1];
}

function countOn(board: boolean[][]): number {
  return board.reduce((sum, row) => sum + row.filter(Boolean).length, 0);
}

export default function App() {
  const [sizeIdx, setSizeIdx] = useState(1);
  const size = SIZES[sizeIdx];
  const [board, setBoard] = useState<boolean[][]>(() => createBoard(SIZES[1]));
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [time, setTime] = useState(0);
  const [started, setStarted] = useState(false);

  const cellSize = Math.floor((Math.min(width, 500) - 30) / size);

  useEffect(() => {
    if (!started || won) return;
    const iv = setInterval(() => setTime(t => t + 1), 1000);
    return () => clearInterval(iv);
  }, [started, won]);

  const handleCell = useCallback((r: number, c: number) => {
    if (won) return;
    if (!started) setStarted(true);
    const newBoard = board.map(row => [...row]);
    toggleCell(newBoard, r, c, size);
    setBoard(newBoard);
    setMoves(m => m + 1);
    if (newBoard.every(row => row.every(cell => !cell))) {
      setWon(true);
    }
  }, [board, won, size, started]);

  const newGame = useCallback((idx: number) => {
    setSizeIdx(idx);
    const s = SIZES[idx];
    setBoard(createBoard(s));
    setMoves(0);
    setWon(false);
    setTime(0);
    setStarted(false);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>💡 Lights Out</Text>
      <Text style={styles.subtitle}>Turn off all the lights!</Text>

      <View style={styles.sizes}>
        {SIZES.map((s, i) => (
          <TouchableOpacity key={i} style={[styles.sizeBtn, sizeIdx === i && styles.sizeActive]} onPress={() => newGame(i)}>
            <Text style={[styles.sizeText, sizeIdx === i && styles.sizeTextActive]}>{s}×{s}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.stats}>
        <Text style={styles.stat}>Moves: {moves}</Text>
        <Text style={styles.stat}>On: {countOn(board)}</Text>
        <Text style={styles.stat}>⏱ {time}s</Text>
      </View>

      <View style={styles.boardContainer}>
        <View style={[styles.board, { width: size * (cellSize + 4) }]}>
          {board.map((row, r) =>
            row.map((on, c) => (
              <TouchableOpacity
                key={`${r}-${c}`}
                style={[styles.cell, { width: cellSize, height: cellSize }, on ? styles.cellOn : styles.cellOff]}
                onPress={() => handleCell(r, c)}
                activeOpacity={0.6}
              />
            ))
          )}
        </View>
      </View>

      <TouchableOpacity style={styles.newBtn} onPress={() => newGame(sizeIdx)}>
        <Text style={styles.newBtnText}>New Puzzle</Text>
      </TouchableOpacity>

      {won && (
        <View style={styles.overlay}>
          <Text style={styles.wonText}>🎉 All Out!</Text>
          <Text style={styles.wonStats}>{moves} moves in {time}s</Text>
          <TouchableOpacity style={styles.playBtn} onPress={() => newGame(sizeIdx)}>
            <Text style={styles.playBtnText}>Next Puzzle</Text>
          </TouchableOpacity>
        </View>
      )}
    <StatusBar style="light" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a', alignItems: 'center', paddingTop: 15 },
  title: { fontSize: 30, fontWeight: 'bold', color: '#f1c40f', marginBottom: 2 },
  subtitle: { color: '#888', fontSize: 14, marginBottom: 10 },
  sizes: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  sizeBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 15, backgroundColor: '#1a1a3e' },
  sizeActive: { backgroundColor: '#f1c40f' },
  sizeText: { color: '#888', fontWeight: 'bold' },
  sizeTextActive: { color: '#000' },
  stats: { flexDirection: 'row', gap: 20, marginBottom: 12 },
  stat: { color: '#ccc', fontSize: 15, fontWeight: '600' },
  boardContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  board: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4 },
  cell: { borderRadius: 8 },
  cellOn: { backgroundColor: '#f1c40f', shadowColor: '#f1c40f', shadowOpacity: 0.6, shadowRadius: 10, elevation: 5 },
  cellOff: { backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#333' },
  newBtn: { marginTop: 12, backgroundColor: '#1a1a3e', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, marginBottom: 15 },
  newBtnText: { color: '#f1c40f', fontWeight: 'bold' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  wonText: { fontSize: 40, fontWeight: 'bold', color: '#f1c40f' },
  wonStats: { fontSize: 18, color: '#aaa', marginTop: 5 },
  playBtn: { marginTop: 15, backgroundColor: '#f1c40f', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 },
  playBtnText: { color: '#000', fontWeight: 'bold', fontSize: 18 },
});
