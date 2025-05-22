
import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Calendar, Shield, Users, Star, ArrowRight } from "lucide-react";

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await User.me();
        setUser(userData);
      } catch (error) {
        // User not logged in
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                Find the perfect babysitter for your family
              </h1>
              <p className="text-lg md:text-xl text-purple-100">
                KIPY connects parents with trusted, experienced babysitters in your area.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                {!user && (
                  <>
                    <Link to={createPageUrl("Register")}>
                      <Button size="lg" className="bg-white text-purple-600 hover:bg-purple-50">
                        Sign Up Now
                      </Button>
                    </Link>
                    <Link to={createPageUrl("Register")}>
                      <Button size="lg" variant="outline" className="text-white border-white hover:bg-purple-700">
                        Sign In
                      </Button>
                    </Link>
                  </>
                )}
                {user?.user_type === "parent" && (
                  <Link to={createPageUrl("FindBabysitter")}>
                    <Button size="lg" className="bg-white text-purple-600 hover:bg-purple-50">
                      Find a Babysitter
                    </Button>
                  </Link>
                )}
                {user?.user_type === "babysitter" && (
                  <Link to={createPageUrl("Availability")}>
                    <Button size="lg" className="bg-white text-purple-600 hover:bg-purple-50">
                      Update Availability
                    </Button>
                  </Link>
                )}
              </div>
            </div>
            <div className="hidden md:block">
              <img 
                src="https://images.unsplash.com/photo-1596662954918-c2a7075ef149?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1287&q=80"
                alt="Happy babysitter with children" 
                className="rounded-lg shadow-lg object-cover h-96 w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">How KIPY Works</h2>
            <p className="text-gray-600 mt-4 max-w-xl mx-auto">
              Our platform makes it easy to find the right childcare solution for your family
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* For Parents */}
            <div className="bg-purple-50 rounded-xl p-6 text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">For Parents</h3>
              <p className="text-gray-600 mb-4">
                Create an account, search for qualified babysitters, and communicate directly through our platform.
              </p>
              <Link to={createPageUrl("Register")} className="inline-flex items-center text-purple-600 font-medium">
                Register as a Parent
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
            
            {/* For Babysitters */}
            <div className="bg-indigo-50 rounded-xl p-6 text-center">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">For Babysitters</h3>
              <p className="text-gray-600 mb-4">
                Create your profile, set your availability, and receive job opportunities from families in your area.
              </p>
              <Link to={createPageUrl("Register")} className="inline-flex items-center text-indigo-600 font-medium">
                Register as a Babysitter
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
            
            {/* Safety First */}
            <div className="bg-pink-50 rounded-xl p-6 text-center">
              <div className="bg-pink-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-pink-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Safety First</h3>
              <p className="text-gray-600 mb-4">
                We verify all users and provide secure messaging to ensure a safe experience for everyone.
              </p>
              <Link to={createPageUrl("About")} className="inline-flex items-center text-pink-600 font-medium">
                Learn About Our Safety Measures
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">What Families Say</h2>
            <p className="text-gray-600 mt-4 max-w-xl mx-auto">
              Hear from parents who have found amazing babysitters through KIPY
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Sarah Johnson",
                quote: "We found an incredible babysitter through KIPY who our kids absolutely adore. The platform made the entire process so simple!",
                rating: 5
              },
              {
                name: "Michael Chen",
                quote: "As working parents, finding reliable childcare was a constant struggle until we discovered KIPY. Now we have peace of mind knowing our children are in good hands.",
                rating: 5
              },
              {
                name: "Emma Rodriguez",
                quote: "The verification process gave us confidence in our babysitter choice. Our sitter is punctual, responsible and our daughter loves her!",
                rating: 4
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center mb-4">
                  {Array(5).fill(0).map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < testimonial.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
                  ))}
                </div>
                <p className="text-gray-600 italic mb-4">"{testimonial.quote}"</p>
                <div className="font-medium">{testimonial.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="bg-purple-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to find your perfect childcare match?</h2>
          <p className="max-w-2xl mx-auto mb-8 text-purple-100">
            Join KIPY today and connect with trusted babysitters in your area
          </p>
          <Link to={createPageUrl("Register")}>
            <Button size="lg" className="bg-white text-purple-600 hover:bg-purple-50">
              Get Started Today
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
