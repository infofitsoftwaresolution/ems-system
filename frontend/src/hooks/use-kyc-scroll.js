import { useEffect, useCallback } from 'react';

/**
 * Custom hook to handle KYC form scrolling
 * Provides smooth scrolling to KYC form when "Complete KYC" is clicked
 */
export const useKycScroll = () => {
  const scrollToKycForm = useCallback(() => {
    // Try multiple selectors to find the KYC form
    const kycForm = document.querySelector(
      '[class*="kyc"], [class*="KYC"], form, #kyc-form, [data-testid*="kyc"], .kyc-form, .KYC-form'
    );
    
    if (kycForm) {
      // Scroll to the form, but leave some space to show the title
      const rect = kycForm.getBoundingClientRect();
      const scrollTop = window.pageYOffset + rect.top - 60; // 60px offset to show title
      window.scrollTo({
        top: scrollTop,
        behavior: 'smooth'
      });
      
      // Add a subtle highlight effect
      kycForm.style.transition = 'box-shadow 0.3s ease';
      kycForm.style.boxShadow = '0 0 10px rgba(59, 130, 246, 0.5)';
      
      // Remove highlight after 2 seconds
      setTimeout(() => {
        kycForm.style.boxShadow = '';
      }, 2000);
    } else {
      // Fallback: scroll to top of page if KYC form not found
      window.scrollTo({ 
        top: 0, 
        behavior: 'smooth' 
      });
    }
  }, []);

  useEffect(() => {
    // Handle clicks on "Complete KYC" buttons/links
    const handleKycClick = (e) => {
      if (e.target && (
        e.target.textContent?.includes('Complete KYC') || 
        e.target.closest('button')?.textContent?.includes('Complete KYC') ||
        e.target.closest('a')?.textContent?.includes('Complete KYC')
      )) {
        setTimeout(scrollToKycForm, 100);
      }
    };

    // Add event listener
    document.addEventListener('click', handleKycClick);

    // Cleanup
    return () => {
      document.removeEventListener('click', handleKycClick);
    };
  }, [scrollToKycForm]);

  return { scrollToKycForm };
};
