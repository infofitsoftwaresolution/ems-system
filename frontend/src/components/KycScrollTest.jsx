import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useKycScroll } from '@/hooks/use-kyc-scroll';

/**
 * Test component to verify KYC scroll functionality
 * This can be removed in production
 */
export const KycScrollTest = () => {
  const { scrollToKycForm } = useKycScroll();

  return (
    <Card className="mb-4 border-dashed">
      <CardHeader>
        <CardTitle className="text-sm">KYC Scroll Test</CardTitle>
        <CardDescription className="text-xs">
          Test the KYC scroll functionality
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={scrollToKycForm}
          variant="outline"
          size="sm"
          className="w-full"
        >
          Test Scroll to KYC Form
        </Button>
      </CardContent>
    </Card>
  );
};


