import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Calendar, MessageSquare, BookOpen, GraduationCap, Users2, Award, Globe } from "lucide-react";

const LearnMore = () => {
  const features = [
    {
      icon: Users,
      title: "Join Clubs",
      description: "Discover and join student organizations at BRAC University that match your interests and passions.",
      color: "text-primary"
    },
    {
      icon: Calendar,
      title: "Campus Events",
      description: "Stay updated with BRACU campus events, competitions, and important academic deadlines.",
      color: "text-accent"
    },
    {
      icon: MessageSquare,
      title: "Connect & Discuss",
      description: "Engage in meaningful discussions with fellow BRACU students through university forums.",
      color: "text-success"
    },
    {
      icon: BookOpen,
      title: "Academic Resources",
      description: "Access BRAC University course materials, career opportunities, and educational resources.",
      color: "text-warning"
    }
  ];

  const portalDetails = [
    {
      icon: GraduationCap,
      title: "Student-Centric Design",
      description: "Built specifically for BRAC University students to enhance their academic and social experience."
    },
    {
      icon: Users2,
      title: "Community Building",
      description: "Foster meaningful connections with peers, faculty, and staff across different departments and schools."
    },
    {
      icon: Award,
      title: "Skill Development",
      description: "Participate in clubs, events, and forums to develop leadership, communication, and organizational skills."
    },
    {
      icon: Globe,
      title: "Digital Campus",
      description: "Access all university activities and resources from anywhere, anytime through our modern web platform."
    }
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-background pt-20">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Learn More About BRACU SAM Portal
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Discover how our Student Activity Management Portal enhances your university experience 
              and connects you with the vibrant BRAC University community.
            </p>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-gradient-to-b from-background to-muted/20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                What You Can Do
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Explore the key features that make BRACU SAM Portal your gateway to an enriched university experience.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <Card key={index} className="bg-gradient-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <CardContent className="p-6 text-center">
                    <div className={`bg-muted/50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4`}>
                      <feature.icon className={`h-8 w-8 ${feature.color}`} />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Portal Details Section */}
        <section className="py-20 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Why Choose BRACU SAM Portal?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Our platform is designed to make your university journey more engaging, connected, and productive.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {portalDetails.map((detail, index) => (
                <Card key={index} className="bg-background border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-8">
                    <div className="flex items-start space-x-4">
                      <div className="bg-primary/10 p-3 rounded-lg">
                        <detail.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-2">{detail.title}</h3>
                        <p className="text-muted-foreground">{detail.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* About BRAC University */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                About BRAC University
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                BRAC University is a private research university in Bangladesh, established in 2001. 
                It is one of the largest private universities in the country, known for its commitment 
                to academic excellence, research, and social responsibility.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                The BRACU SAM Portal represents our commitment to providing students with modern, 
                digital tools to enhance their educational experience and build a strong, connected campus community.
              </p>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default LearnMore;
