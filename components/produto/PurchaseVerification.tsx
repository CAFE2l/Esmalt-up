"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";

export function usePurchaseVerification(productId: string) {
  const { user } = useAuth();
  const [hasPurchased, setHasPurchased] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !productId) return;
    
    async function checkPurchase() {
      setLoading(true);
      try {
        const token = await user.getIdToken();
        const response = await fetch(`/api/user-purchases?productId=${encodeURIComponent(productId)}`, {
          headers: {
            authorization: `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setHasPurchased(data.hasPurchased || false);
        }
      } catch (error) {
        console.error("Error checking purchase status:", error);
        setHasPurchased(false);
      } finally {
        setLoading(false);
      }
    }

    checkPurchase();
  }, [user, productId]);

  return { hasPurchased, loading };
}
