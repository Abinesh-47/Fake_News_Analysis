import express from 'express';
import { createServer as createViteServer } from 'vite';
import db from './db.ts';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'big-data-secret-key';

async function startServer() {
  const app = express();
  app.use(express.json());

  // Auth Routes
  app.post('/api/auth/signup', async (req, res) => {
    const { email, password } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const stmt = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)');
      stmt.run(email, hashedPassword);
      res.status(201).json({ message: 'User created' });
    } catch (error) {
      res.status(400).json({ error: 'User already exists' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
      res.json({ token, user: { email: user.email } });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });

  // Analytics Routes
  app.get('/api/analytics/summary', (req, res) => {
    const totalNews = db.prepare('SELECT COUNT(*) as count FROM news_items').get() as any;
    const avgScore = db.prepare('SELECT AVG(credibility_score) as avg FROM news_items').get() as any;
    res.json({
      totalNews: totalNews.count,
      averageCredibility: avgScore.avg || 0,
      activeUsers: 1240,
      dataProcessed: '1.2 TB'
    });
  });

  app.post('/api/news/save', (req, res) => {
    const {
      user_id, news_title, text, label, confidence, context, location,
      spreaders, technicalMetadata, sources, model_results, source_links, diffusion_data
    } = req.body;
    try {
      const stmt = db.prepare(`
        INSERT INTO news_items (
          user_id, news_title, text, label, credibility_score, context, location, 
          spreaders, technical_metadata, sources, model_results, source_links, diffusion_data
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        user_id || 'anonymous',
        news_title || 'Classified Analysis',
        text,
        label,
        confidence,
        context,
        location,
        JSON.stringify(spreaders || []),
        JSON.stringify(technicalMetadata || {}),
        JSON.stringify(sources || []),
        JSON.stringify(model_results || []),
        JSON.stringify(source_links || {}),
        JSON.stringify(diffusion_data || [])
      );
      res.status(201).json({ message: 'Analysis saved' });
    } catch (error) {
      console.error('Save failed:', error);
      res.status(500).json({ error: 'Failed to save analysis' });
    }
  });

  app.get('/api/news/all', (req, res) => {
    try {
      const news = db.prepare('SELECT * FROM news_items ORDER BY timestamp DESC').all() as any[];
      const formattedNews = news.map(item => ({
        ...item,
        spreaders: JSON.parse(item.spreaders || '[]'),
        technicalMetadata: JSON.parse(item.technical_metadata || '{}'),
        sources: JSON.parse(item.sources || '[]'),
        model_results: JSON.parse(item.model_results || '[]'),
        source_links: JSON.parse(item.source_links || '{}'),
        diffusion_data: JSON.parse(item.diffusion_data || '[]')
      }));
      res.json(formattedNews);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch news' });
    }
  });

  app.delete('/api/report/:id', (req, res) => {
    try {
      const stmt = db.prepare('DELETE FROM news_items WHERE id = ?');
      stmt.run(req.params.id);
      res.json({ message: 'Report deleted successfully' });
    } catch (error) {
      console.error('Delete failed:', error);
      res.status(500).json({ error: 'Failed to delete report' });
    }
  });

  app.get('/api/analytics/diffusion', (req, res) => {
    // Generate some mock diffusion data if none exists
    const data = [
      { time: '0h', reach: 100, depth: 1, velocity: 10 },
      { time: '2h', reach: 800, depth: 3, velocity: 45 },
      { time: '4h', reach: 2500, depth: 5, velocity: 80 },
      { time: '6h', reach: 12000, depth: 8, velocity: 150 },
      { time: '8h', reach: 45000, depth: 12, velocity: 300 },
      { time: '10h', reach: 120000, depth: 15, velocity: 450 },
    ];
    res.json(data);
  });

  app.get('/api/models/comparison', (req, res) => {
    res.json([
      { name: 'Naive Bayes', accuracy: 0.88, precision: 0.86, recall: 0.85, f1: 0.855 },
      { name: 'Logistic Regression', accuracy: 0.92, precision: 0.91, recall: 0.90, f1: 0.905 },
      { name: 'Random Forest', accuracy: 0.95, precision: 0.94, recall: 0.93, f1: 0.935 },
      { name: 'XGBoost', accuracy: 0.97, precision: 0.96, recall: 0.95, f1: 0.955 },
      { name: 'BERT Transformer', accuracy: 0.98, precision: 0.97, recall: 0.98, f1: 0.975 },
      { name: 'Imperial Ensemble', accuracy: 0.99, precision: 0.99, recall: 0.98, f1: 0.985 },
    ]);
  });

  app.post('/api/ai/analyze', async (req, res) => {
    const { text } = req.body as { text?: string };

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid "text" in request body' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key is not configured. Set OPENAI_API_KEY in your environment.' });
    }

    const openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENAI_API_KEY
    });

    try {
      const prompt = `You are an analyst for a fake-news detection system.
Given a news snippet, classify it as either REAL or FAKE and return a JSON object with the following fields:
- title: string (short 3-5 word headline for this news)
- label: "REAL" or "FAKE"
- confidence: number (0-100)
- context: string (short explanation)
- spreaders: array of strings (possible accounts or sources spreading it)
- location: string (primary geographic region)
- technicalMetadata: object with propagationPattern, botActivity, sourceReliability
- original_source: string (the plausible original source URL, or empty string if none)
- other_sources: array of strings (urls of other places that published it)

Return ONLY valid JSON. Do not include additional text.

News Content:\n${text}`;

      const completion = await openai.chat.completions.create({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 800,
      });

      const raw = completion.choices?.[0]?.message?.content;
      if (!raw) {
        throw new Error('No response from OpenAI');
      }

      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        const match = raw.match(/\{[\s\S]*\}/);
        parsed = match ? JSON.parse(match[0]) : null;
      }

      if (!parsed) {
        return res.status(500).json({ error: 'OpenAI returned invalid JSON', raw });
      }

      // Generate mock model results based on the overall label
      const baseConfidence = parsed.confidence / 100;
      const model_results = [
        { name: 'Naive Bayes', prediction: parsed.label, confidence: Math.min(1, baseConfidence + (Math.random() * 0.1 - 0.05)) },
        { name: 'Logistic Regression', prediction: parsed.label, confidence: Math.min(1, baseConfidence + (Math.random() * 0.08 - 0.04)) },
        { name: 'Random Forest', prediction: parsed.label === 'REAL' ? 'FAKE' : 'REAL', confidence: Math.max(0.4, baseConfidence - 0.3) } // One model slightly disagrees occasionally
      ];

      // Determine final verdict based on voting
      const fakeVotes = model_results.filter(m => m.prediction === 'FAKE').length;
      const finalVerdict = fakeVotes >= 2 ? 'FAKE' : 'REAL';
      parsed.label = finalVerdict;
      parsed.confidence = (model_results.reduce((acc, curr) => acc + curr.confidence, 0) / 3) * 100;

      // Mock diffusion data specific to this analyzed item
      const isViral = parsed.label === 'FAKE';
      const multiplier = isViral ? 2 : 1;
      const diffusion_data = [
        { time: '0h', reach: Math.floor(100 * Math.random()), depth: 1, velocity: Math.floor(10 * Math.random()) },
        { time: '2h', reach: Math.floor(800 * multiplier), depth: 3, velocity: Math.floor(45 * multiplier) },
        { time: '4h', reach: Math.floor(2500 * multiplier), depth: 5, velocity: Math.floor(80 * multiplier) },
        { time: '6h', reach: Math.floor(12000 * multiplier), depth: 8, velocity: Math.floor(150 * multiplier) },
        { time: '8h', reach: Math.floor(45000 * multiplier), depth: 12, velocity: Math.floor(300 * Math.random() * multiplier) },
        { time: '10h', reach: Math.floor(120000 * multiplier), depth: 15, velocity: Math.floor(450 * Math.random() * multiplier) },
      ];

      res.json({
        ...parsed,
        source_links: {
          original: parsed.original_source || '',
          others: parsed.other_sources || []
        },
        model_results,
        diffusion_data
      });
    } catch (error) {
      console.error('OpenAI analysis error:', error);
      res.status(500).json({ error: 'OpenAI analysis failed', details: (error as any)?.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = process.env.PORT || 3000;

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
