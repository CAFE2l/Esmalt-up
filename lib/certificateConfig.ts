/**
 * Certificate Render Configuration
 * All positions are percentages of the certificate image dimensions
 */

export interface CertificateTextPosition {
  x: number; // percentage from left (0-100)
  y: number; // percentage from top (0-100)
  textAlign: 'left' | 'center' | 'right';
  fontSize?: string; // CSS font size (e.g., '2rem', 'clamp(...)')
  maxWidth?: number; // percentage max width
  fontWeight?: number;
  color?: string;
}

export interface CertificateImagePosition {
  x: number; // percentage from left
  y: number; // percentage from top
  width: number; // percentage width
  height?: number; // percentage height (defaults to maintaining aspect ratio)
}

export interface CertificateConfig {
  front: {
    recipientName: CertificateTextPosition;
    issueDate: CertificateTextPosition;
    certificateId: CertificateTextPosition;
    signature: CertificateImagePosition;
    qrCode?: CertificateImagePosition;
    // Font configurations
    nameFont?: string;
    dateFont?: string;
    idFont?: string;
  };
  back: {
    header: {
      recipientName: CertificateTextPosition;
      issueDate: CertificateTextPosition;
      publicCode: CertificateTextPosition;
    };
    content: {
      marginTop: number;
      marginBottom: number;
      marginLeft: number;
      marginRight: number;
    };
    footer: {
      verificationLink: CertificateTextPosition;
      disclaimer: CertificateTextPosition;
    };
  };
  // Default dimensions
  width: number; // in pixels
  height: number; // in pixels
  // For mobile scaling
  mobile: {
    width: number;
    height: number;
  };
}

// Certificate configuration based on the design
// These are typical positions for a portrait certificate
export const CERTIFICATE_CONFIG: CertificateConfig = {
  width: 800,
  height: 600,
  mobile: {
    width: 375,
    height: 550,
  },
  front: {
    // Recipient name - typically centered at the top-middle area
    recipientName: {
      x: 50,
      y: 35,
      textAlign: 'center',
      fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
      maxWidth: 80,
      fontWeight: 600,
      color: '#2d2227', // Dark plum text
    },
    // Issue date - below the name
    issueDate: {
      x: 50,
      y: 45,
      textAlign: 'center',
      fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
      maxWidth: 80,
      color: '#2d2227',
    },
    // Certificate ID - at the bottom
    certificateId: {
      x: 50,
      y: 85,
      textAlign: 'center',
      fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
      maxWidth: 80,
      color: '#2d2227',
    },
    // Signature position
    signature: {
      x: 65,
      y: 75,
      width: 25,
      height: 10,
    },
    // Font configurations
    nameFont: '"Georgia", "Times New Roman", serif',
    dateFont: '"Poppins", sans-serif',
    idFont: '"Poppins", sans-serif',
  },
  back: {
    header: {
      recipientName: {
        x: 50,
        y: 10,
        textAlign: 'center',
        fontSize: 'clamp(1.5rem, 4vw, 2rem)',
        maxWidth: 90,
        fontWeight: 600,
        color: '#2d2227',
      },
      issueDate: {
        x: 50,
        y: 18,
        textAlign: 'center',
        fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
        color: '#2d2227',
      },
      publicCode: {
        x: 50,
        y: 25,
        textAlign: 'center',
        fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
        color: '#2d2227',
      },
    },
    content: {
      marginTop: 30,
      marginBottom: 20,
      marginLeft: 10,
      marginRight: 10,
    },
    footer: {
      verificationLink: {
        x: 50,
        y: 95,
        textAlign: 'center',
        fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
        color: '#2d2227',
      },
      disclaimer: {
        x: 50,
        y: 98,
        textAlign: 'center',
        fontSize: 'clamp(0.625rem, 1.5vw, 0.75rem)',
        color: '#666',
      },
    },
  },
};

// Configuration for different certificate types if needed
export const CERTIFICATE_TYPES = {
  'nail-designer-iniciante': {
    courseName: 'Nail Designer Iniciante',
    ...CERTIFICATE_CONFIG,
  },
};

// Get configuration for a specific certificate type
export function getCertificateConfig(courseId: string = 'nail-designer-iniciante'): CertificateConfig {
  return CERTIFICATE_TYPES[courseId as keyof typeof CERTIFICATE_TYPES] || CERTIFICATE_CONFIG;
}
