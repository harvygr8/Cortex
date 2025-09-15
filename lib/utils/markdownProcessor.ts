export async function processDocument(file) {
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileType = file.name.split('.').pop().toLowerCase();
    
    // Support both text and markdown files
    if (!['txt', 'md', 'markdown'].includes(fileType)) {
      throw new Error(`Unsupported file type: ${fileType}. Supported types: txt, md, markdown`);
    }

    const content = buffer.toString('utf-8')
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return {
      title: file.name.replace(/\.[^/.]+$/, ''),
      content: content
    };
  } catch (error) {
    console.error('Document processing error:', error);
    throw new Error(`Failed to process document: ${error.message}`);
  }
} 