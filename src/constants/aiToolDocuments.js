const aiToolDocuments = [
  {
    slug: 'writing',
    title: 'AI 写作工具',
    sourceFile: 'AI 写作工具_v5SBcu7QU7NxSt2bw7XQIu.docx',
  },
  {
    slug: 'image-generation',
    title: 'AI 图像生成与设计工具',
    sourceFile: 'AI 图像生成与设计工具_DGMhfYltoyAVH8eTzswD5I.docx',
  },
  {
    slug: 'image-editing',
    title: 'AI 图像处理工具',
    sourceFile: 'AI 图像处理工具_ev5kdTYAxwgvqfdBlR4Xrw.docx',
  },
  {
    slug: 'presentation',
    title: 'AI PPT 工具',
    sourceFile: 'AI PPT 工具_akLH1ZBupcnkKY1F8rFQwi.docx',
  },
  {
    slug: 'video',
    title: 'AI 视频工具',
    sourceFile: 'AI 视频工具_cGAH0v9sJuC7ausYplgtoZ.docx',
  },
  {
    slug: 'mind-map',
    title: 'AI 思维导图工具',
    sourceFile: 'AI 思维导图工具_4R3xNse8mB5qvY9lsQ1exz.docx',
  },
  {
    slug: 'rag',
    title: 'AI RAG 知识库工具',
    sourceFile: 'AI RAG 知识库工具_SZFSakqK2zxRRaEeD8P7Zd.docx',
  },
  {
    slug: 'digital-human',
    title: 'AI 数字人工具',
    sourceFile: ' AI 数字人工具_3qeAJyy9pOR665fQdgyEDB.docx',
  },
  {
    slug: 'text-to-speech',
    title: 'AI 文字转语音',
    sourceFile: 'AI文字转语音_2sSKvfd7rqh7K7unJSEDYr.docx',
  },
  {
    slug: 'face-swap',
    title: 'AI 换脸工具',
    sourceFile: 'AI换脸工具_GP6XoMuAT2vgHK1e4jLiGs.docx',
  },
  {
    slug: 'other',
    title: 'AI 其他工具',
    sourceFile: 'AI 其他工具_MR5PiBY3hB1QUGDAzBilm3.docx',
  },
].map((document) => ({
  ...document,
  pdf: `/ai-tools-documents/${document.slug}.pdf`,
}));

export default aiToolDocuments;
