import sanitizeHtml from 'sanitize-html';
export const sanitizeString = (value) => {
    return sanitizeHtml(value, {
        allowedTags: [],
        allowedAttributes: {},
    }).trim();
};
