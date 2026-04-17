#!/usr/bin/env node
/**
 * Memory TF-IDF Retrieval - Context-aware fact retrieval
 *
 * Purpose: Retrieve relevant facts based on current conversation context
 *
 * Borrowed from: DeerFlow memory system
 *
 * Key concepts:
 * - TF-IDF (Term Frequency - Inverse Document Frequency)
 * - Context-aware scoring: similarity * 0.6 + confidence * 0.4
 * - max_injection_tokens budget (default: 2000)
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(process.env.HOME, '.openclaw', 'workspace');
const MEMORY_FILE = path.join(WORKSPACE, 'MEMORY.md');
const FACTS_FILE = path.join(WORKSPACE, 'state', 'memory-facts.json');

class TFIDFRetrieval {
  constructor() {
    this.documents = [];
    this.termFrequency = new Map();
    this.inverseDocumentFrequency = new Map();
    this.documentCount = 0;
  }

  /**
   * Tokenize text into terms
   */
  tokenize(text) {
    // Simple tokenization: lowercase, split by whitespace, remove punctuation
    return text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(term => term.length > 2);
  }

  /**
   * Calculate term frequency for a document
   */
  calculateTermFrequency(tokens) {
    const tf = new Map();
    const totalTerms = tokens.length;

    for (const term of tokens) {
      tf.set(term, (tf.get(term) || 0) + 1);
    }

    // Normalize by total terms
    for (const [term, count] of tf) {
      tf.set(term, count / totalTerms);
    }

    return tf;
  }

  /**
   * Add document to corpus
   */
  addDocument(docId, content) {
    const tokens = this.tokenize(content);
    this.documents.push({ docId, tokens, content });
    this.documentCount++;

    // Update term frequency
    const tf = this.calculateTermFrequency(tokens);
    this.termFrequency.set(docId, tf);

    // Update inverse document frequency counts
    const uniqueTerms = new Set(tokens);
    for (const term of uniqueTerms) {
      this.inverseDocumentFrequency.set(term, (this.inverseDocumentFrequency.get(term) || 0) + 1);
    }
  }

  /**
   * Calculate IDF for a term
   */
  calculateIDF(term) {
    const docCount = this.inverseDocumentFrequency.get(term) || 0;
    if (docCount === 0) return 0;
    return Math.log(this.documentCount / docCount);
  }

  /**
   * Calculate TF-IDF score for a term in a document
   */
  calculateTFIDF(docId, term) {
    const tf = this.termFrequency.get(docId)?.get(term) || 0;
    const idf = this.calculateIDF(term);
    return tf * idf;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(vec1, vec2) {
    // vec1 and vec2 are Maps: term -> score
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (const [term, score1] of vec1) {
      const score2 = vec2.get(term) || 0;
      dotProduct += score1 * score2;
      norm1 += score1 * score1;
    }

    for (const [, score2] of vec2) {
      norm2 += score2 * score2;
    }

    if (norm1 === 0 || norm2 === 0) return 0;
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * Get TF-IDF vector for a document
   */
  getTFIDFVector(docId) {
    const vector = new Map();
    const tf = this.termFrequency.get(docId);

    if (!tf) return vector;

    for (const [term] of tf) {
      vector.set(term, this.calculateTFIDF(docId, term));
    }

    return vector;
  }

  /**
   * Find most similar documents to query
   */
  findSimilar(query, topK = 5) {
    // Add query as temporary document
    const queryDocId = 'query';
    const queryTokens = this.tokenize(query);
    const queryTF = this.calculateTermFrequency(queryTokens);

    // Build query TF-IDF vector
    const queryVector = new Map();
    for (const term of queryTokens) {
      const tf = queryTF.get(term) || 0;
      const idf = this.calculateIDF(term);
      queryVector.set(term, tf * idf);
    }

    // Calculate similarity with all documents
    const similarities = [];
    for (const doc of this.documents) {
      const docVector = this.getTFIDFVector(doc.docId);
      const similarity = this.cosineSimilarity(queryVector, docVector);
      similarities.push({ docId: doc.docId, similarity, content: doc.content });
    }

    // Sort by similarity and return top K
    similarities.sort((a, b) => b.similarity - a.similarity);
    return similarities.slice(0, topK);
  }
}

class MemoryFactsManager {
  constructor() {
    this.facts = this.loadFacts();
  }

  loadFacts() {
    try {
      if (fs.existsSync(FACTS_FILE)) {
        const data = JSON.parse(fs.readFileSync(FACTS_FILE, 'utf8'));
        return data.facts || [];  // Handle schema wrapper
      }
    } catch {
      // ignore
    }
    return [];  // Always return array
  }

  saveFacts() {
    fs.mkdirSync(path.dirname(FACTS_FILE), { recursive: true });
    const data = {
      facts: this.facts,
      _schema: 'memory-facts-v1',
      _description: 'Context-aware memory facts storage (borrowed from DeerFlow)'
    };
    fs.writeFileSync(FACTS_FILE, JSON.stringify(data, null, 2));
  }

  /**
   * Add a fact
   */
  addFact(content, category = 'context', confidence = 0.5) {
    const fact = {
      id: `fact_${Date.now()}`,
      content,
      category,
      confidence,
      createdAt: new Date().toISOString(),
      source: 'auto'
    };

    this.facts.push(fact);
    this.saveFacts();
    return fact;
  }

  /**
   * Get all facts sorted by confidence
   */
  getFactsSortedByConfidence() {
    return this.facts.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Retrieve relevant facts based on context
   */
  retrieveRelevantFacts(context, maxTokens = 2000) {
    if (!context || this.facts.length === 0) {
      return this.getFactsSortedByConfidence().slice(0, 5);
    }

    // Build TF-IDF corpus from facts
    const tfidf = new TFIDFRetrieval();
    this.facts.forEach(fact => {
      tfidf.addDocument(fact.id, fact.content);
    });

    // Find similar facts
    const similar = tfidf.findSimilar(context, 10);

    // Score: similarity * 0.6 + confidence * 0.4
    const scored = similar.map(item => {
      const fact = this.facts.find(f => f.id === item.docId);
      const confidence = fact?.confidence || 0.5;
      const finalScore = (item.similarity * 0.6) + (confidence * 0.4);
      return {
        ...fact,
        similarity: item.similarity,
        finalScore
      };
    });

    // Sort by final score
    scored.sort((a, b) => b.finalScore - a.finalScore);

    // Estimate tokens and limit by budget
    const result = [];
    let tokenCount = 0;

    for (const fact of scored) {
      const factTokens = Math.ceil(fact.content.length / 4); // Rough estimate
      if (tokenCount + factTokens <= maxTokens) {
        result.push(fact);
        tokenCount += factTokens;
      }
    }

    return result;
  }
}

// CLI interface
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'add':
    const content = args[1];
    const category = args[2] || 'context';
    const confidence = parseFloat(args[3]) || 0.5;
    const manager = new MemoryFactsManager();
    const fact = manager.addFact(content, category, confidence);
    console.log(JSON.stringify(fact, null, 2));
    break;

  case 'retrieve':
    const context = args[1] || '';
    const maxTokens = parseInt(args[2]) || 2000;
    const factsManager = new MemoryFactsManager();
    const facts = factsManager.retrieveRelevantFacts(context, maxTokens);
    console.log(JSON.stringify(facts, null, 2));
    break;

  case 'list':
    const listManager = new MemoryFactsManager();
    console.log(JSON.stringify(listManager.getFactsSortedByConfidence(), null, 2));
    break;

  case 'test':
    // Test TF-IDF
    const testTFIDF = new TFIDFRetrieval();
    testTFIDF.addDocument('doc1', 'DeerFlow is a super agent harness');
    testTFIDF.addDocument('doc2', 'OpenClaw is a personal assistant');
    testTFIDF.addDocument('doc3', 'Memory system uses TF-IDF');

    const similarDocs = testTFIDF.findSimilar('agent harness', 2);
    console.log('TF-IDF Test:');
    console.log('Query: "agent harness"');
    console.log('Results:');
    similarDocs.forEach(doc => {
      console.log(`  ${doc.docId}: similarity=${doc.similarity.toFixed(3)}, content="${doc.content}"`);
    });

    // Test Facts Manager
    const testManager = new MemoryFactsManager();
    testManager.addFact('用户偏好飞书交互', 'user_preference', 0.9);
    testManager.addFact('用户反感重复消息', 'user_preference', 0.8);
    testManager.addFact('模型降级会导致降智', 'lesson', 0.95);

    const relevantFacts = testManager.retrieveRelevantFacts('飞书交互优化', 500);
    console.log('\nFacts Retrieval Test:');
    console.log('Context: "飞书交互优化"');
    console.log('Results:');
    relevantFacts.forEach(fact => {
      console.log(`  ${fact.content}: score=${fact.finalScore.toFixed(3)}, confidence=${fact.confidence}`);
    });
    break;

  default:
    console.log('Usage: memory-tfidf-retrieval.js [add|retrieve|list|test]');
    console.log('');
    console.log('Commands:');
    console.log('  add <content> <category> <confidence> - Add a fact');
    console.log('  retrieve <context> <maxTokens> - Retrieve relevant facts');
    console.log('  list - List all facts');
    console.log('  test - Test TF-IDF retrieval');
}

module.exports = { TFIDFRetrieval, MemoryFactsManager };