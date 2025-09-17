import { SEOHead } from '@/components/SEOHead';
import { getAllBlogPosts } from '@/data/blogPosts';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/header";
import { Clock, User, Calendar } from 'lucide-react';
import { Link } from 'wouter';

export default function Blog() {
  const allPosts = getAllBlogPosts();
  const featuredPost = allPosts[0];
  const recentPosts = allPosts.slice(1);
  const categories = ['Tutorials', 'Photography', 'WordPress', 'API', 'SEO'];

  const seoData = {
    title: 'Image Optimization Blog - Tips, Tutorials & Best Practices | MicroJPEG',
    description: 'Expert guides on image compression, optimization techniques, and web performance. Learn from professionals about JPEG, PNG, WebP optimization and more.',
    keywords: 'image optimization blog, image compression tutorials, web performance tips, JPEG optimization guide, image SEO best practices',
  };

  return (
    <>
      <SEOHead
        title={seoData.title}
        description={seoData.description}
        keywords={seoData.keywords}
        canonicalUrl="https://microjpeg.com/blog"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Blog",
          "name": "MicroJPEG Blog",
          "description": "Expert guides on image optimization and compression",
          "publisher": {
            "@type": "Organization",
            "name": "MicroJPEG"
          }
        }}
      />
      
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        {/* Hero Section */}
        <section className="pt-20 sm:pt-24 pb-12 sm:pb-16 bg-gradient-to-br from-blue-50 to-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
                Image Optimization <span className="text-blue-600">Expert Blog</span>
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Professional guides, tutorials, and best practices for image compression, 
                optimization, and web performance. Learn from industry experts.
              </p>
            </div>
          </div>
        </section>

        {/* Featured Post */}
        {featuredPost && (
          <section className="py-12 sm:py-16 bg-white">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Featured Article</h2>
              
              <Card className="overflow-hidden shadow-lg">
                <div className="lg:flex">
                  <div className="lg:w-2/3 p-4 sm:p-6 lg:p-8">
                    <Badge className="mb-4 bg-blue-100 text-blue-800 border-blue-200">
                      {featuredPost.category}
                    </Badge>
                    
                    <h3 className="text-3xl font-bold mb-4">
                      <Link 
                        href={`/blog/${featuredPost.slug}`}
                        className="hover:text-blue-600"
                        data-testid={`link-featured-post-${featuredPost.id}`}
                      >
                        {featuredPost.title}
                      </Link>
                    </h3>
                    
                    <p className="text-gray-600 mb-6 text-lg">
                      {featuredPost.excerpt}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-6 text-gray-500 mb-6">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        {featuredPost.author}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        {featuredPost.readTime} min read
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        {new Date(featuredPost.publishDate).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-6">
                      {featuredPost.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-gray-600">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    
                    <Link href={`/blog/${featuredPost.slug}`}>
                      <Button size="lg" data-testid="button-read-featured">
                        Read Full Article
                      </Button>
                    </Link>
                  </div>
                  
                  <div className="lg:w-1/3 bg-gradient-to-br from-blue-100 to-purple-100 p-8 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl font-bold text-white">#{featuredPost.id}</span>
                      </div>
                      <p className="text-gray-700 font-medium">Featured Guide</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </section>
        )}

        {/* Recent Posts */}
        <section className="py-12 sm:py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 sm:mb-12 gap-4">
              <h2 className="text-2xl sm:text-3xl font-bold">Recent Articles</h2>
              
              {/* Category Filter */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="cursor-pointer hover:bg-blue-50 h-8 px-3">
                  All
                </Badge>
                {categories.map((category) => (
                  <Badge 
                    key={category}
                    variant="outline" 
                    className="cursor-pointer hover:bg-blue-50 h-8 px-3"
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
              {recentPosts.map((post) => (
                <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow hover-lift">
                  <div className="p-6">
                    <Badge className="mb-3 bg-gray-100 text-gray-800">
                      {post.category}
                    </Badge>
                    
                    <h3 className="font-bold text-xl mb-3 line-clamp-2">
                      <Link 
                        href={`/blog/${post.slug}`}
                        className="hover:text-blue-600"
                        data-testid={`link-post-${post.id}`}
                      >
                        {post.title}
                      </Link>
                    </h3>
                    
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span>{post.readTime} min read</span>
                      <span>
                        {new Date(post.publishDate).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {post.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {post.tags.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{post.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                    
                    <Link href={`/blog/${post.slug}`}>
                      <Button variant="outline" size="sm" className="w-full" data-testid={`button-read-${post.id}`}>
                        Read Article
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter Signup */}
        <section className="py-12 sm:py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Stay Updated</h2>
            <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8">
              Get the latest tips and tutorials on image optimization delivered to your inbox.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                data-testid="input-newsletter-email"
              />
              <Button className="h-12 sm:h-10 px-6 text-base sm:text-sm" data-testid="button-subscribe-newsletter">
                Subscribe
              </Button>
            </div>
            
            <p className="text-sm text-gray-500 mt-4">
              No spam. Unsubscribe anytime. We respect your privacy.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}