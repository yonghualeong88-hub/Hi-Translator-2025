// 简单的测试API
import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🧪 测试API被调用');
  
  return res.status(200).json({
    success: true,
    message: '后端API工作正常',
    timestamp: new Date().toISOString()
  });
}
