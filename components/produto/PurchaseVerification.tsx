"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";

export function usePurchaseVerification(productId: string) {
  const { user } = useAuth();
  const [hasPurchased, setHasPurchased] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    if (!user || !productId) {
      setHasPurchased(false);
      setLoading(false);
      return () => {
        active = false;
      };
    }
    const currentUser = user;
    
    async function checkPurchase() {
      setLoading(true);
      try {
        const token = await currentUser.getIdToken();
        const response = await fetch(`/api/user-purchases?productId=${encodeURIComponent(productId)}`, {
          headers: {
            authorization: `Bearer ${token}`,
          },
        });
        
        const data = await response.json().catch(() => ({}));
        if (active) setHasPurchased(response.ok && Boolean(data.hasPurchased));
      } catch (error) {
        console.error("Error checking purchase status:", error);
        if (active) setHasPurchased(false);
      } finally {
        if (active) setLoading(false);
      }
    }

    void checkPurchase();
    return () => {
      active = false;
    };
  }, [user, productId]);

  return { hasPurchased, loading };
}
