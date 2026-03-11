"use client";

import { useState, useEffect } from "react";
import Joyride, { CallBackProps, STATUS, Step } from "react-joyride";

interface TutorialProps {
  run: boolean;
  onFinish: () => void;
}

export default function Tutorial({ run, onFinish }: TutorialProps) {
  const [mounted, setMounted] = useState(false);

  // Ensure Joyride only renders on the client side to prevent Next.js errors
  useEffect(() => {
    setMounted(true);
  }, []);

  // Define the tour steps
  const steps: Step[] = [
    {
      target: ".tour-cashflow-chart",
      content: (
        <div>
          <h4 style={{ fontWeight: "bold", marginBottom: "8px" }}>The Big Picture</h4>
          <p style={{ fontSize: "14px", lineHeight: "1.5" }}>
            Here is Sarah and John's retirement trajectory. We simulate their wealth out to age 95, adjusting for inflation, so they know exactly how much spending power they have.
          </p>
        </div>
      ),
      placement: "bottom",
      disableBeacon: true,
    },
    {
      target: ".tour-tax-breakdown",
      content: (
        <div>
          <h4 style={{ fontWeight: "bold", marginBottom: "8px" }}>Optimized Tax Bite</h4>
          <p style={{ fontSize: "14px", lineHeight: "1.5" }}>
            We calculate the exact taxes they'll pay each year. The engine automatically decides when to pull from RRSPs vs. TFSAs to minimize the CRA's cut.
          </p>
        </div>
      ),
      placement: "left",
    },
    {
      target: ".tour-guardrails",
      content: (
        <div>
          <h4 style={{ fontWeight: "bold", marginBottom: "8px" }}>Dynamic Guardrails</h4>
          <p style={{ fontSize: "14px", lineHeight: "1.5" }}>
            If the market drops, our engine automatically suggests safe spending adjustments to keep their plan on track. Less anxiety, more confidence.
          </p>
        </div>
      ),
      placement: "right",
    },
    {
      target: ".tour-clear-data",
      content: (
        <div>
          <h4 style={{ fontWeight: "bold", marginBottom: "8px" }}>Your Turn</h4>
          <p style={{ fontSize: "14px", lineHeight: "1.5" }}>
            Ready to see your own future? Click here to clear this sample data and enter your numbers. Remember: <strong>Your data never leaves your device.</strong>
          </p>
        </div>
      ),
      placement: "bottom",
    },
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      onFinish();
    }
  };

  if (!mounted) return null;

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous={true}
      showProgress={true}
      showSkipButton={true}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          arrowColor: "#ffffff",
          backgroundColor: "#ffffff",
          overlayColor: "rgba(0, 0, 0, 0.65)", // Dark, calm overlay
          primaryColor: "#0d9488", // Teal to match your splash screen
          textColor: "#334155", // Dark grey text
          zIndex: 10000,
        },
        buttonNext: {
          borderRadius: "8px",
          fontWeight: "600",
        },
        buttonBack: {
          marginRight: "10px",
          color: "#64748b",
        },
        buttonSkip: {
          color: "#94a3b8",
        },
      }}
    />
  );
}