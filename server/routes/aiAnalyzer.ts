import { Router } from 'express';
import { 
  analyzeFieldsWithAI, 
  verifyFieldMappings, 
  analyzeUnstructuredContent,
  detectContentPattern 
} from '../aiFieldAnalyzer';

const router = Router();

// Analyze CSV/structured data fields
router.post('/api/ai/analyze-fields', async (req, res) => {
  try {
    const { headers, sampleRows, fileType } = req.body;

    if (!headers || !sampleRows || !fileType) {
      return res.status(400).json({ 
        error: 'Missing required fields: headers, sampleRows, fileType' 
      });
    }

    // Get initial AI analysis
    const analysis = await analyzeFieldsWithAI(headers, sampleRows, fileType);

    // Create sample content for verification
    const sampleContent: Record<string, string> = {};
    analysis.fieldMappings.forEach(mapping => {
      if (mapping.targetField && sampleRows[0]) {
        sampleContent[mapping.targetField] = String(sampleRows[0][mapping.sourceField] || '');
      }
    });

    // Verify the mappings with a second pass
    const verification = await verifyFieldMappings(analysis, sampleContent);

    // Use corrections if needed
    const finalAnalysis = verification.corrections || analysis;

    res.json({
      success: true,
      analysis: finalAnalysis,
      verified: verification.verified,
      verificationConfidence: verification.confidence
    });
  } catch (error) {
    console.error('AI field analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze fields', 
      details: error.message 
    });
  }
});

// Analyze unstructured content
router.post('/api/ai/analyze-unstructured', async (req, res) => {
  try {
    const { content, fileType } = req.body;

    if (!content || !fileType) {
      return res.status(400).json({ 
        error: 'Missing required fields: content, fileType' 
      });
    }

    const result = await analyzeUnstructuredContent(content, fileType);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Unstructured analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze unstructured content', 
      details: error.message 
    });
  }
});

// Detect if content is a prompt or description
router.post('/api/ai/detect-content-type', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ 
        error: 'Missing required field: text' 
      });
    }

    const result = await detectContentPattern(text);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Content type detection error:', error);
    res.status(500).json({ 
      error: 'Failed to detect content type', 
      details: error.message 
    });
  }
});

export default router;