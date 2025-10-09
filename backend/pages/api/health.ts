import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 简单的健康检查，不测试OpenAI（避免超时和费用）
    const hasApiKey = !!process.env.OPENAI_API_KEY;
    
    res.status(200).json({
      status: 'healthy',
      server: 'running',
      openai: {
        apiKeyConfigured: hasApiKey
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}
