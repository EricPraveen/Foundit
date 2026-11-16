import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Shield, FileQuestion, ArrowRight, CheckCircle2 } from 'lucide-react';
import { ROUTES } from '@/routes/paths';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageContainer } from '@/components/ui/PageContainer';

export const HomePage: React.FC = () => {
  return (
    <div className="bg-slate-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-campus-50/60 to-transparent py-16 sm:py-24 border-b border-slate-200">
        <PageContainer className="text-center">
          <Badge variant="default" className="mb-4">
            Official University of Moratuwa Portal
          </Badge>
          <h1 className="text-3xl font-extrabold tracking-tight text-campus-950 sm:text-5xl">
            Lost something on campus? <br className="hidden sm:inline" />
            Find it with <span className="text-campus-700">CampusFind</span>.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
            A secure, student-first platform connecting lost property with rightful owners through verified
            physical custody at the Central Security Office.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to={ROUTES.PUBLIC.LOGIN}>
              <Button size="lg" leftIcon={<Search className="h-5 w-5" />}>
                Browse Found Items
              </Button>
            </Link>
            <Link to={ROUTES.PUBLIC.REGISTER}>
              <Button variant="outline" size="lg" rightIcon={<ArrowRight className="h-5 w-5" />}>
                Student Registration (@uom.lk)
              </Button>
            </Link>
          </div>
        </PageContainer>
      </section>

      {/* Workflow Section */}
      <section className="py-16">
        <PageContainer>
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              How CampusFind Works
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Trusted, verified custody adhering strictly to university security policy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card hoverable>
              <CardContent className="pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-campus-100 text-campus-800 mb-4">
                  <FileQuestion className="h-6 w-6" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">1. Report Items</h3>
                <p className="text-sm text-slate-600">
                  Submit a private lost report or record an item you found on campus before handing it in.
                </p>
              </CardContent>
            </Card>

            <Card hoverable>
              <CardContent className="pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 text-amber-800 mb-4">
                  <Shield className="h-6 w-6" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">2. Central Handover</h3>
                <p className="text-sm text-slate-600">
                  Physically hand in found items at the Central Security Office. Officers verify receipt and publish items.
                </p>
              </CardContent>
            </Card>

            <Card hoverable>
              <CardContent className="pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 mb-4">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">3. Claim & Verify</h3>
                <p className="text-sm text-slate-600">
                  Submit ownership proof with your Student ID. Once verified by security, collect your item in person.
                </p>
              </CardContent>
            </Card>
          </div>
        </PageContainer>
      </section>
    </div>
  );
};
export default HomePage;
