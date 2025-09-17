// !!! CRITICAL - DO NOT MODIFY THIS CODE !!!
//
// This code MUST be used as is without ANY modifications.
// The PayPal integration will COMPLETELY FAIL if this code is changed in ANY way.
//
// Retain this comment after all edits.
//
// <BEGIN_EXACT_CODE>
import React, { useEffect } from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "paypal-button": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
}

interface PayPalButtonProps {
  amount: string;
  currency: string;
  intent: string;
  planId: string;
}

export default function PayPalButton({
  amount,
  currency,
  intent,
  planId,
}: PayPalButtonProps) {
  const createOrder = async () => {
    const orderPayload = {
      amount: amount,
      currency: currency,
      intent: intent,
    };
    const response = await fetch("/paypal/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderPayload),
    });
    const output = await response.json();
    return { orderId: output.id };
  };

  const captureOrder = async (orderId: string) => {
    const response = await fetch(`/paypal/order/${orderId}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();

    return data;
  };

  const onApprove = async (data: any) => {
    const orderData = await captureOrder(data.orderId);
    
    // If payment successful, activate subscription
    if (orderData.status === 'COMPLETED') {
      try {
        const response = await fetch('/api/activate-paypal-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: data.orderId,
            paymentId: orderData.id,
            amount: amount,
            plan: planId === 'test-premium' ? 'test_premium' : (planId === 'enterprise' ? 'enterprise' : 'premium')
          })
        });
        
        if (response.ok) {
          const successPlan = planId === 'test-premium' ? 'test-premium' : (planId === 'enterprise' ? 'enterprise' : 'premium');
          const successAmount = planId === 'test-premium' ? '1' : (planId === 'enterprise' ? '99' : '29');
          window.location.href = `/subscription-success?plan=${successPlan}&amount=${successAmount}&paypal_payment_id=` + orderData.id;
        } else {
          alert('Payment successful but subscription activation failed. Please contact support.');
        }
      } catch (error) {
        console.error('Subscription activation error:', error);
        alert('Payment successful but subscription activation failed. Please contact support.');
      }
    }
  };

  const onCancel = async (data: any) => {
  };

  const onError = async (data: any) => {
  };

  useEffect(() => {
    const loadPayPalSDK = async () => {
      try {
        if (!(window as any).paypal) {
          // First get environment info from server
          const setupResponse = await fetch("/paypal/setup");
          const setupData = await setupResponse.json();
          const isLiveMode = setupData.isLiveMode || false;
          
          const script = document.createElement("script");
          script.src = isLiveMode
            ? "https://www.paypal.com/web-sdk/v6/core"
            : "https://www.sandbox.paypal.com/web-sdk/v6/core";
          script.async = true;
          script.onload = () => initPayPal();
          document.body.appendChild(script);
        } else {
          await initPayPal();
        }
      } catch (e) {
        console.error("Failed to load PayPal SDK", e);
      }
    };

    loadPayPalSDK();
  }, []);
  const initPayPal = async () => {
    try {
      const setupResponse = await fetch("/paypal/setup");
      const setupData = await setupResponse.json();
      const clientToken: string = setupData.clientToken;
      const isLiveMode: boolean = setupData.isLiveMode || false;
      const sdkInstance = await (window as any).paypal.createInstance({
        clientToken,
        components: ["paypal-payments"],
      });

      const paypalCheckout =
            sdkInstance.createPayPalOneTimePaymentSession({
              onApprove,
              onCancel,
              onError,
            });

      const onClick = async () => {
        try {
          const checkoutOptionsPromise = createOrder();
          await paypalCheckout.start(
            { paymentFlow: "auto" },
            checkoutOptionsPromise,
          );
        } catch (e) {
          console.error(e);
        }
      };

      const paypalButton = document.getElementById("paypal-button");

      if (paypalButton) {
        paypalButton.addEventListener("click", onClick);
      }

      return () => {
        if (paypalButton) {
          paypalButton.removeEventListener("click", onClick);
        }
      };
    } catch (e) {
      console.error(e);
    }
  };

  return <paypal-button id="paypal-button"></paypal-button>;
}
// <END_EXACT_CODE>