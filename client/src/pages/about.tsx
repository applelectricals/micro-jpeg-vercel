import { Shield, Zap, Users, Award, Target, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Header from '@/components/header';
import Footer from '@/components/footer';
import logoUrl from '@assets/mascot-logo-optimized.png';

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Header />
      
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <img src={logoUrl} alt="MicroJPEG Logo" className="w-16 h-16" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            About MicroJPEG
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're on a mission to make image compression effortless, fast, and accessible 
            to everyone - from individual photographers to enterprise teams.
          </p>
        </div>

        {/* Our Story */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Story</h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Born from the frustration of slow, unreliable image compression tools, 
              MicroJPEG was created to deliver enterprise-grade compression technology 
              through a simple, intuitive interface. We believe that powerful tools 
              should be accessible to everyone, regardless of technical expertise.
            </p>
          </div>
        </div>

        {/* Mission & Values */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="p-6 text-center hover:shadow-lg transition-shadow">
            <Target className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-3">Our Mission</h3>
            <p className="text-gray-600">
              To democratize professional-grade image compression, making it fast, 
              reliable, and accessible to creators worldwide.
            </p>
          </Card>

          <Card className="p-6 text-center hover:shadow-lg transition-shadow">
            <Heart className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-3">Our Values</h3>
            <p className="text-gray-600">
              Simplicity, reliability, and performance. We prioritize user experience 
              and build tools that just work, every time.
            </p>
          </Card>

          <Card className="p-6 text-center hover:shadow-lg transition-shadow">
            <Award className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-3">Our Vision</h3>
            <p className="text-gray-600">
              To become the go-to platform for image optimization, trusted by 
              millions of users for their most important projects.
            </p>
          </Card>
        </div>

        {/* What We Do */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What We Do</h2>
            <p className="text-lg text-gray-600">
              We've built the most advanced image compression platform that combines 
              cutting-edge algorithms with intuitive design.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex items-start gap-4">
              <Zap className="w-8 h-8 text-blue-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Lightning Fast</h3>
                <p className="text-gray-600">
                  Our optimized compression engine processes images up to 10x faster 
                  than traditional tools, without compromising quality.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Shield className="w-8 h-8 text-green-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure & Private</h3>
                <p className="text-gray-600">
                  Your images are processed securely and automatically deleted after 
                  download. We never store or access your private content.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Users className="w-8 h-8 text-purple-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Built for Teams</h3>
                <p className="text-gray-600">
                  From individual creators to enterprise teams, our platform scales 
                  to meet your needs with flexible plans and API access.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Award className="w-8 h-8 text-orange-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Industry Leading</h3>
                <p className="text-gray-600">
                  Trusted by photographers, designers, and developers who demand 
                  the best compression quality and reliability.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-blue-600 rounded-2xl p-8 mb-16 text-white">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Trusted by Creators Worldwide</h2>
            <p className="text-blue-100">
              Join thousands of satisfied users who trust MicroJPEG for their image optimization needs.
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold mb-2">1M+</div>
              <div className="text-blue-100">Images Compressed</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">50k+</div>
              <div className="text-blue-100">Happy Users</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">99.9%</div>
              <div className="text-blue-100">Uptime</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">24/7</div>
              <div className="text-blue-100">Support</div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Experience the Difference?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of creators who've made the switch to faster, 
            more reliable image compression.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => window.location.href = '/'}
            >
              Start Compressing Free
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => window.location.href = '/simple-pricing'}
            >
              View Pricing
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}