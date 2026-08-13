import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  image: string;
  url?: string;
  favicon?: string;
}

const DEFAULT_FAVICON = "https://res.cloudinary.com/lyjyvy54/image/upload/v1786435194/%ED%8C%8C%EB%B9%84%EC%BD%98%EC%9A%A9_e3yju3.png";

export default function SEO({ title, description, image, url, favicon = DEFAULT_FAVICON }: SEOProps) {
  useEffect(() => {
    // Update basic tags
    document.title = title;
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) metaDescription.setAttribute('content', description);

    // Update Favicon links dynamically
    ['icon', 'shortcut icon', 'apple-touch-icon'].forEach((relType) => {
      let link = document.querySelector(`link[rel="${relType}"]`) as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = relType;
        document.head.appendChild(link);
      }
      link.href = favicon;
    });

    // Update Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', title);

    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) ogDescription.setAttribute('content', description);

    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage) ogImage.setAttribute('content', image);
    
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', url || window.location.href);

    // Update Twitter tags
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) twitterTitle.setAttribute('content', title);

    const twitterDescription = document.querySelector('meta[name="twitter:description"]');
    if (twitterDescription) twitterDescription.setAttribute('content', description);

    const twitterImage = document.querySelector('meta[name="twitter:image"]');
    if (twitterImage) twitterImage.setAttribute('content', image);
    
    // Update itemprop image
    const itemPropImage = document.querySelector('meta[itemprop="image"]');
    if (itemPropImage) itemPropImage.setAttribute('content', image);

  }, [title, description, image, url, favicon]);

  return null;
}
