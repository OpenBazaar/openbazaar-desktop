const htmlFilter = {
  allowedTags: [
    'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'u',
    'ul', 'ol', 'li', 'b', 'i', 'strong', 'em',
    'strike', 'hr', 'br', 'img', 'blockquote', 'span',
    'picture', 'source',
    'dl', 'dt', 'dd',
    'summary', 'details',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'alt'],
    img: ['src', 'style'],
    source: ['srcset', 'media'],
  },
  transformTags: {
    h1: 'h2',
  },
  allowedSchemes: ['http', 'https', 'ftp', 'mailto', 'ob2'],
};

export default htmlFilter;

