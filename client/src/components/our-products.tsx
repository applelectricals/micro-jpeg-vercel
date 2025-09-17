import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Code, Download, Zap, Globe, ArrowRight, CheckCircle } from "lucide-react";

export default function OurProducts() {
  const products = [
    {
      id: "web-free",
      title: "Web Free",
      subtitle: "and Web Premium",
      icon: Crown,
      iconColor: "text-green-600",
      cardColor: "border-green-200",
      badgeColor: "bg-green-100 text-green-800",
      badge: "Most Popular",
      description: "The online compressor empowers you to easily optimize your images. Seamlessly convert to WebP or efficiently compress extensive batches to minimize file sizes, all with ease.",
      buttonText: "Start Free",
      buttonColor: "bg-green-600 hover:bg-green-700",
      action: () => window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    {
      id: "api-integration", 
      title: "API",
      subtitle: "Integration",
      icon: Code,
      iconColor: "text-purple-600",
      cardColor: "border-purple-200",
      description: "Integrate Micro JPEG's powerful image API seamlessly into your workflow. Explore advanced features like resizing, converting, and cropping for a comprehensive experience.",
      buttonText: "Learn more",
      buttonColor: "bg-purple-600 hover:bg-purple-700",
      action: () => window.location.href = '/api-docs'
    },
    {
      id: "wordpress-plugin",
      title: "WordPress",
      subtitle: "Plugin", 
      icon: Globe,
      iconColor: "text-blue-600",
      cardColor: "border-blue-200",
      description: "Accelerate your WordPress website with the Micro JPEG plugin. Automated image compression for fast page load times and enhanced user experience.",
      buttonText: "Go to WP plugin",
      buttonColor: "bg-blue-600 hover:bg-blue-700",
      action: () => window.open('/api/download/wordpress-plugin', '_blank')
    }
  ];

  return (
    <section className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-teal-600 font-medium text-sm uppercase tracking-wide mb-3">
            OUR PRODUCTS
          </p>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Optimization for each project
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Tailored solutions for website owners, developers, and designers, ensuring optimal website performance for
            every project. Discover the advantages of faster loading times with our image optimization tools.
          </p>
        </div>

        {/* Product Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {products.map((product) => {
            const IconComponent = product.icon;
            return (
              <Card 
                key={product.id} 
                className={`relative h-full ${product.cardColor} border-2 hover:shadow-lg transition-shadow duration-200`}
              >
                <CardContent className="p-8 h-full flex flex-col">
                  {/* Badge */}
                  {product.badge && (
                    <Badge className={`absolute top-4 right-4 ${product.badgeColor} font-medium`}>
                      {product.badge}
                    </Badge>
                  )}

                  {/* Icon */}
                  <div className="mb-6">
                    <div className={`w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center`}>
                      <IconComponent className={`w-6 h-6 ${product.iconColor}`} />
                    </div>
                  </div>

                  {/* Title */}
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {product.title} <span className="text-gray-600 font-normal">{product.subtitle}</span>
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 mb-8 flex-grow leading-relaxed">
                    {product.description}
                  </p>

                  {/* Action Button */}
                  <Button 
                    className={`w-full ${product.buttonColor} text-white`}
                    onClick={product.action}
                    data-testid={`button-${product.id}`}
                  >
                    {product.buttonText}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>

                  {/* Color accent bar */}
                  <div className={`absolute bottom-0 left-0 right-0 h-1 ${
                    product.iconColor.includes('green') ? 'bg-green-600' :
                    product.iconColor.includes('purple') ? 'bg-purple-600' : 'bg-blue-600'
                  }`} />
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Additional Features Row */}
        <div className="mt-16 grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-teal-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Lightning Fast</h4>
            <p className="text-gray-600 text-sm">Process images in milliseconds with our optimized compression algorithms</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-teal-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Quality Preserved</h4>
            <p className="text-gray-600 text-sm">Advanced algorithms maintain visual quality while reducing file sizes</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Globe className="w-6 h-6 text-teal-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Global CDN</h4>
            <p className="text-gray-600 text-sm">Worldwide distribution for fast processing from any location</p>
          </div>
        </div>
      </div>
    </section>
  );
}