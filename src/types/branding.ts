export interface Branding {
  orgId: string;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  appName: string | null;
}

export interface UpdateBrandingDto {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  appName?: string;
}
