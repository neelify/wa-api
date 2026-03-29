

/**
 * Send a message to target
 *
 * @param sessionId - Session ID
 * @param jid - Target
 * @param content - Message content
 * @param options - Message options
 */
export declare function sendMessage(
    sessionId: string,
    jid: string,
    content: import("@neelify/baileys/lib").AnyMessageContent,
    options?: import("@neelify/baileys/lib").MiscMessageGenerationOptions
  ): Promise<import("@neelify/baileys/lib").proto.WebMessageInfo>;
    /**
 * Sendet einen rohen WAMessage-Stanza an WhatsApp.
 *
 * @param sessionId  Deine Session-ID
 * @param jid        Ziel-JID oder Telefonnummer (z. B. '491234567890@s.whatsapp.net' oder 'status@broadcast')
 * @param content    Raw-Message-Node (z. B. protocolMessage, videoMessage, etc.)
 * @param options    Optional: Relay-Parameter wie messageId, participant, additionalNodes, statusJidList
 * @returns          Promise mit der gesendeten Nachricht-ID (msgId)
 */
/**
 * Low-level relayMessage-Wrapper für direkten Baileys-Stanza Dispatch.
 *
 * Sendet ein rohes WAMessage-Stanza (z.B. protocolMessage, disappearingMessagesInChat,
 * videoMessage, etc.) direkt an WhatsApp über die interne `relayMessage`-Methode.
 *
 * @param sessionId  Deine Multi-Session-ID
 * @param jid        Ziel-JID oder Telefonnummer (z.B. '491234567890@s.whatsapp.net' oder 'status@broadcast')
 * @param content    Raw-Message-Node (proto.WebMessageInfo oder AnyMessageContent-ähnlich)
 * @param options    Optional: Relay-Parameter wie `messageId`, `participant`, `additionalNodes`,
 *                   `statusJidList`, `useCachedGroupMetadata`, usw.
 * @returns          Promise mit der gesendeten Nachricht-ID (`msgId`)
 */
export declare function relayMessage(
  sessionId: string,
  jid: string,
  content: any,
  options?: import('@neelify/baileys/lib').MiscMessageGenerationOptions
): Promise<string>;
