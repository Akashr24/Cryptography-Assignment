import React, { useState, useEffect } from 'react';
import './PlayfairCipher.css';

export default function PlayfairCipher({ onLogout }) {
    const [key, setKey] = useState('MONARCHY');
    const [inputText, setInputText] = useState('');
    const [matrix, setMatrix] = useState([]);
    const [pairs, setPairs] = useState([]);
    const [steps, setSteps] = useState([]);
    const [result, setResult] = useState('—');
    const [status, setStatus] = useState({ message: '', isError: false });

    // Clean text helper
    const cleanText = (text) => {
        return text
            .toUpperCase()
            .replace(/[^A-Z]/g, '')
            .replace(/J/g, 'I');
    };

    // Create 5x5 Playfair Matrix
    const createMatrix = (secretKey) => {
        const alphabet = 'ABCDEFGHIKLMNOPQRSTUVWXYZ';
        let characters = '';
        const cleanedKey = cleanText(secretKey);
        const combined = cleanedKey + alphabet;
        const used = new Set();

        for (let char of combined) {
            if (!used.has(char)) {
                used.add(char);
                characters += char;
            }
        }

        const grid = [];
        for (let row = 0; row < 5; row++) {
            grid.push(characters.slice(row * 5, row * 5 + 5).split(''));
        }
        return grid;
    };

    // Update matrix on key change
    useEffect(() => {
        if (key.trim()) {
            setMatrix(createMatrix(key));
        }
    }, [key]);

    const getPositions = (grid) => {
        const positions = {};
        for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 5; c++) {
                positions[grid[r][c]] = { row: r, col: c };
            }
        }
        return positions;
    };

    const prepareText = (text) => {
        const cleaned = cleanText(text);
        const digraphs = [];
        let i = 0;

        while (i < cleaned.length) {
            const first = cleaned[i];
            const second = cleaned[i + 1];

            if (!second) {
                digraphs.push(first + 'X');
                i++;
                continue;
            }

            if (first === second) {
                digraphs.push(first + 'X');
                i++;
                continue;
            }

            digraphs.push(first + second);
            i += 2;
        }

        return digraphs;
    };

    const transformPair = (pair, grid, decrypt = false) => {
        const positions = getPositions(grid);
        const first = positions[pair[0]];
        const second = positions[pair[1]];

        let res = '';
        let rule = '';

        if (first.row === second.row) {
            const shift = decrypt ? -1 : 1;
            const newFirstCol = (first.col + shift + 5) % 5;
            const newSecondCol = (second.col + shift + 5) % 5;

            res = grid[first.row][newFirstCol] + grid[second.row][newSecondCol];
            rule = decrypt ? 'Same row → move left' : 'Same row → move right';
        } else if (first.col === second.col) {
            const shift = decrypt ? -1 : 1;
            const newFirstRow = (first.row + shift + 5) % 5;
            const newSecondRow = (second.row + shift + 5) % 5;

            res = grid[newFirstRow][first.col] + grid[newSecondRow][second.col];
            rule = decrypt ? 'Same column → move up' : 'Same column → move down';
        } else {
            res = grid[first.row][second.col] + grid[second.row][first.col];
            rule = 'Rectangle → swap columns';
        }

        return { result: res, rule };
    };

    const processCipher = (decrypt = false) => {
        if (!key.trim()) {
            setStatus({ message: 'Please enter a secret key.', isError: true });
            return;
        }

        if (!inputText.trim()) {
            setStatus({ message: 'Please enter some text.', isError: true });
            return;
        }

        const grid = createMatrix(key);
        setMatrix(grid);

        const digraphs = prepareText(inputText);
        setPairs(digraphs);

        let output = '';
        const transformationSteps = [];

        for (let pair of digraphs) {
            const transformation = transformPair(pair, grid, decrypt);
            output += transformation.result;
            transformationSteps.push({
                input: pair,
                rule: transformation.rule,
                output: transformation.result
            });
        }

        setResult(output);
        setSteps(transformationSteps);
        setStatus({
            message: `${decrypt ? 'Decryption' : 'Encryption'} completed successfully. ${digraphs.length} digraph(s) processed.`,
            isError: false
        });
    };

    const handleClear = () => {
        setInputText('');
        setResult('—');
        setPairs([]);
        setSteps([]);
        setStatus({ message: '', isError: false });
    };

    const handleCopy = async () => {
        if (result === '—' || !result) {
            setStatus({ message: 'There is no result to copy.', isError: true });
            return;
        }

        try {
            await navigator.clipboard.writeText(result);
            setStatus({ message: 'Result copied to clipboard.', isError: false });
        } catch {
            setStatus({ message: 'Unable to copy the result.', isError: true });
        }
    };

    return (
        <div className="playfair-wrapper">
            <div className="container">
                <header>
                    <div className="header-top">
                        <div className="badge">CRYPTOGRAPHY PROJECT</div>
                        {onLogout && (
                            <button className="logout-btn" onClick={onLogout}>
                                🚪 Exit System
                            </button>
                        )}
                    </div>
                    <h1>Playfair <span>Cipher</span></h1>
                    <p>Encrypt and decrypt messages using the classical Playfair Cipher.</p>
                </header>

                {/* INPUT SECTION */}
                <section className="card">
                    <div className="input-group">
                        <label htmlFor="key">Secret Key</label>
                        <input
                            type="text"
                            id="key"
                            value={key}
                            onChange={(e) => setKey(e.target.value)}
                            placeholder="Enter key"
                        />
                        <small>J is automatically converted to I.</small>
                    </div>

                    <div className="input-group">
                        <label htmlFor="inputText">Plaintext / Ciphertext</label>
                        <textarea
                            id="inputText"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Enter your message..."
                        ></textarea>
                    </div>

                    <div className="buttons">
                        <button className="encrypt" onClick={() => processCipher(false)}>
                            🔒 Encrypt
                        </button>
                        <button className="decrypt" onClick={() => processCipher(true)}>
                            🔓 Decrypt
                        </button>
                        <button className="clear" onClick={handleClear}>
                            Clear
                        </button>
                    </div>

                    {status.message && (
                        <p id="status" className={status.isError ? 'error' : ''}>
                            {status.message}
                        </p>
                    )}
                </section>

                {/* MATRIX + RESULT */}
                <section className="two-column">
                    <div className="card">
                        <h2>5 × 5 Key Matrix</h2>
                        <p className="description">Generated using the secret key.</p>
                        <div className="matrix">
                            {matrix.map((row, rIdx) =>
                                row.map((char, cIdx) => (
                                    <div key={`${rIdx}-${cIdx}`} className="cell">
                                        {char}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="card">
                        <div className="result-header">
                            <div>
                                <h2>Result</h2>
                                <p className="description">Encrypted or decrypted output</p>
                            </div>
                            <button className="copy-btn" onClick={handleCopy}>
                                Copy
                            </button>
                        </div>
                        <div className="result">{result}</div>
                    </div>
                </section>

                {/* DIGRAPHS */}
                <section className="card">
                    <h2>Prepared Digraphs</h2>
                    <p className="description">
                        Text is divided into pairs before encryption or decryption.
                    </p>
                    <div className="pairs">
                        {pairs.length === 0 ? (
                            <span>No text processed yet.</span>
                        ) : (
                            pairs.map((pair, idx) => (
                                <span key={idx} className="pair">
                                    {pair}
                                </span>
                            ))
                        )}
                    </div>
                </section>

                {/* STEPS */}
                <section className="card">
                    <h2>Step-by-Step Transformation</h2>
                    <p className="description">Shows the Playfair rule applied to each pair.</p>
                    <div className="steps">
                        {steps.length === 0 ? (
                            <div>Run encryption or decryption to see the steps.</div>
                        ) : (
                            steps.map((step, idx) => (
                                <div key={idx} className="step">
                                    <div className="step-number">
                                        {String(idx + 1).padStart(2, '0')}
                                    </div>
                                    <div className="step-pair">{step.input}</div>
                                    <div className="step-rule">{step.rule}</div>
                                    <div className="step-output">{step.output}</div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* RULES */}
                <section className="card">
                    <h2>Playfair Cipher Rules</h2>
                    <div className="rules">
                        <div className="rule">
                            <div className="number">01</div>
                            <h3>Same Row</h3>
                            <p>
                                Move each letter one position to the right during encryption and left during decryption.
                            </p>
                        </div>
                        <div className="rule">
                            <div className="number">02</div>
                            <h3>Same Column</h3>
                            <p>
                                Move each letter one position downward during encryption and upward during decryption.
                            </p>
                        </div>
                        <div className="rule">
                            <div className="number">03</div>
                            <h3>Rectangle</h3>
                            <p>
                                If the letters are in different rows and columns, use the opposite corners of the rectangle.
                            </p>
                        </div>
                        <div className="rule">
                            <div className="number">04</div>
                            <h3>Repeated Letters</h3>
                            <p>
                                Insert X between repeated letters in a pair. X is also used for odd-length messages.
                            </p>
                        </div>
                    </div>
                </section>

                <footer>Playfair Cipher • HTML + CSS + JavaScript</footer>
            </div>
        </div>
    );
}
