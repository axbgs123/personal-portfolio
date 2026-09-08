import { createStudioCatChatHandler } from '../../server/studioCatChat.mjs';

export const config = { api: { bodyParser: { sizeLimit: '48kb' } } };

export default createStudioCatChatHandler();
