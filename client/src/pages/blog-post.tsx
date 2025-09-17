import { useRoute } from 'wouter';
import { SEOHead } from '@/components/SEOHead';
import Header from '@/components/header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getBlogPost, getAllBlogPosts } from '@/data/blogPosts';
import { Clock, User, Tag, ArrowLeft, Share2 } from 'lucide-react';
import { Link } from 'wouter';
import ReactMarkdown from 'react-markdown';

export default function BlogPost() {
  const [, params] = useRoute('/blog/:slug');
  const post = params?.slug ? getBlogPost(params.slug) : null;
  const allPosts = getAllBlogPosts();
  const relatedPosts = allPosts.filter(p => p.id !== post?.id).slice(0, 3);

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="pt-24 pb-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Post Not Found</h1>
            <p className="text-gray-600 mb-8">The blog post you're looking for doesn't exist.</p>
            <Link href="/blog">
              <Button data-testid="button-back-to-blog">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Blog
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title={post.seoTitle}
        description={post.seoDescription}
        keywords={post.keywords}
        canonicalUrl={`https://microjpeg.com/blog/${post.slug}`}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          "headline": post.title,
          "description": post.excerpt,
          "author": {
            "@type": "Person",
            "name": post.author
          },
          "datePublished": post.publishDate,
          "dateModified": post.publishDate,
          "publisher": {
            "@type": "Organization",
            "name": "MicroJPEG",
            "logo": "https://microjpeg.com/logo.png"
          }
        }}
      />
      
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        {/* Blog Post Header */}
        <article className="pt-24 pb-16">
          <div className="max-w-4xl mx-auto px-4">
            {/* Breadcrumb */}
            <div className="mb-8">
              <Link href="/blog" className="text-blue-600 hover:text-blue-800 flex items-center">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Blog
              </Link>
            </div>

            {/* Post Header */}
            <header className="mb-12">
              <div className="mb-4">
                <Badge className="bg-blue-100 text-blue-800 border-blue-200 mb-4">
                  {post.category}
                </Badge>
              </div>
              
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                {post.title}
              </h1>
              
              <p className="text-xl text-gray-600 mb-8">
                {post.excerpt}
              </p>

              {/* Post Meta */}
              <div className="flex flex-wrap items-center gap-6 text-gray-500 mb-8">
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  {post.author}
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  {post.readTime} min read
                </div>
                <div className="flex items-center">
                  {new Date(post.publishDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-8">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-gray-600">
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Share Button */}
              <Button 
                variant="outline" 
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: post.title,
                      text: post.excerpt,
                      url: window.location.href,
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                  }
                }}
                data-testid="button-share-post"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </header>

            {/* Post Content */}
            <div className="prose prose-lg max-w-none mb-12">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => <h1 className="text-3xl font-bold mt-8 mb-4">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-2xl font-bold mt-8 mb-4">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-xl font-bold mt-6 mb-3">{children}</h3>,
                  p: ({ children }) => <p className="mb-4 text-gray-700 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="mb-4 pl-6 list-disc">{children}</ul>,
                  ol: ({ children }) => <ol className="mb-4 pl-6 list-decimal">{children}</ol>,
                  li: ({ children }) => <li className="mb-2 text-gray-700">{children}</li>,
                  code: ({ children }) => (
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-4">
                      {children}
                    </pre>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 my-4">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {post.content}
              </ReactMarkdown>
            </div>

            {/* CTA Section */}
            <Card className="p-8 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 mb-12">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-4">Ready to Optimize Your Images?</h3>
                <p className="text-gray-600 mb-6">
                  Try our professional image compression service with advanced algorithms 
                  and support for 13+ formats.
                </p>
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700" data-testid="button-try-compressor">
                  Try MicroJPEG Compressor
                </Button>
              </div>
            </Card>
          </div>
        </article>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="py-16 bg-white">
            <div className="max-w-6xl mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-12">Related Articles</h2>
              
              <div className="grid md:grid-cols-3 gap-8">
                {relatedPosts.map((relatedPost) => (
                  <Card key={relatedPost.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="p-6">
                      <Badge className="mb-3 bg-gray-100 text-gray-800">
                        {relatedPost.category}
                      </Badge>
                      
                      <h3 className="font-bold text-lg mb-3 line-clamp-2">
                        <Link 
                          href={`/blog/${relatedPost.slug}`}
                          className="hover:text-blue-600"
                        >
                          {relatedPost.title}
                        </Link>
                      </h3>
                      
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {relatedPost.excerpt}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{relatedPost.readTime} min read</span>
                        <span>
                          {new Date(relatedPost.publishDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  );
}