"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Loader2, CheckCircle } from "lucide-react";
import { api } from "@/lib/api-client";
import { Link as I18nLink } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { ClubSelector } from "@/components/ClubSelector";
import { TeamLogoUpload } from "@/components/TeamLogoUpload";
import { TournamentLayout } from "@/components/tournament/tournament-layout";

// Types for the registration data
interface RegistrationInfo {
  tournament: {
    id: string;
    name: string;
    description?: string;
    registrationInfo?: string;
    registrationDeadline?: string;
    autoAcceptTeams: boolean;
    allowWaitlist: boolean;
    startDate: string;
    endDate: string;
    location: {
      city?: string;
      country: {
        name: string;
        code: string;
      };
    };
    divisions: Array<{
      id: string;
      name: string;
      description?: string;
      birthYear?: number;
      format?: string;
      level: string;
      minTeams: number;
      maxTeams: number;
      currentTeams: number;
      registrationFee?: {
        id: string;
        name: string;
        description?: string;
        amount: number;
        currency: string;
      };
      availableSpots: number;
      isFull: boolean;
      isWaitlistAvailable: boolean;
    }>;
    isRegistrationOpen: boolean;
    isLocked: boolean;
    lockedAt?: string;
    lockedBy?: string;
  };
}

interface RegistrationFormData {
  // Team Information
  teamName: string;
  teamLogo: string;
  club: string;
  clubId: string;
  clubSelectionType: "existing" | "new";
  divisionId: string;

  // Contact Person
  contactFirstName: string;
  contactLastName: string;
  contactAddress: string;
  contactPostalCode: string;
  contactCity: string;
  contactPhone: string;
  contactEmail: string;

  // Billing Address (optional)
  billingName: string;
  billingAddress: string;
  billingPostalCode: string;
  billingCity: string;
  billingEmail: string;

  // Terms
  acceptTerms: boolean;
  acceptPrivacy: boolean;
}

export default function TournamentRegistrationPage() {
  const t = useTranslations("registration");
  const params = useParams();
  const tournamentId = params.id as string;

  const [registrationInfo, setRegistrationInfo] =
    useState<RegistrationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [saveAndCreateAnother, setSaveAndCreateAnother] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showNewClubForm, setShowNewClubForm] = useState(false);

  const [formData, setFormData] = useState<RegistrationFormData>({
    teamName: "",
    teamLogo: "",
    club: "",
    clubId: "",
    clubSelectionType: "existing",
    divisionId: "",
    contactFirstName: "",
    contactLastName: "",
    contactAddress: "",
    contactPostalCode: "",
    contactCity: "",
    contactPhone: "",
    contactEmail: "",
    billingName: "",
    billingAddress: "",
    billingPostalCode: "",
    billingCity: "",
    billingEmail: "",
    acceptTerms: false,
    acceptPrivacy: false,
  });

  // Fetch tournament registration information
  useEffect(() => {
    const fetchRegistrationInfo = async () => {
      try {
        const data = await api.tournaments.getRegistrationInfo(tournamentId);
        setRegistrationInfo(data);
      } catch (err) {
        // Check if the error is a tournament lock error
        if (
          err instanceof Error &&
          err.message.includes("Tournament is locked")
        ) {
          // Set a special flag to indicate tournament is locked
          setRegistrationInfo({
            tournament: {
              id: tournamentId,
              name: "Tournament",
              autoAcceptTeams: false,
              allowWaitlist: false,
              startDate: "",
              endDate: "",
              location: {
                country: { name: "", code: "" },
              },
              divisions: [],
              isRegistrationOpen: false,
              isLocked: true,
            },
          });
        } else {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load tournament information"
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRegistrationInfo();
  }, [tournamentId]);

  const handleInputChange = (
    field: keyof RegistrationFormData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetFormForAnother = () => {
    setFormData((prev) => ({
      ...prev,
      // Reset only division and team name, keep everything else
      divisionId: "",
      teamName: "",
      // Keep all contact and billing info
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Filter out empty optional fields
      const submitData = {
        ...formData,
        tournamentId,
        city: formData.contactCity,
        country: registrationInfo?.tournament.location.country.name || "",
        // Only include optional fields if they have values
        ...(formData.billingName && { billingName: formData.billingName }),
        ...(formData.billingAddress && {
          billingAddress: formData.billingAddress,
        }),
        ...(formData.billingPostalCode && {
          billingPostalCode: formData.billingPostalCode,
        }),
        ...(formData.billingCity && { billingCity: formData.billingCity }),
        ...(formData.billingEmail && { billingEmail: formData.billingEmail }),
      };

      await api.registrations.submit(submitData);

      if (saveAndCreateAnother) {
        // Reset form for another registration
        resetFormForAnother();
        setSaveAndCreateAnother(false);
        setShowSuccessMessage(true);
        // Hide success message after 3 seconds
        setTimeout(() => setShowSuccessMessage(false), 3000);
      } else {
        setSubmitSuccess(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedDivision = registrationInfo?.tournament.divisions.find(
    (div) => div.id === formData.divisionId
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (error || !registrationInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {t("registrationNotAvailable")}
          </h2>
          <p className="text-gray-600 mb-4">
            {error || t("registrationUnavailable")}
          </p>
          <I18nLink href={`/tournaments/${tournamentId}`}>
            <Button>{t("backToTournament")}</Button>
          </I18nLink>
        </div>
      </div>
    );
  }

  // Check if tournament is locked
  if (registrationInfo.tournament.isLocked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {t("tournamentLocked")}
          </h2>
          <p className="text-gray-600 mb-4">
            {t("tournamentLockedDescription")}
          </p>
          <p className="text-sm text-gray-500 mb-6">
            {t("tournamentLockedReason")}
          </p>
          <I18nLink href={`/tournaments/${tournamentId}`}>
            <Button>{t("backToTournament")}</Button>
          </I18nLink>
        </div>
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {t("registrationSuccess")}
          </h2>
          <p className="text-gray-600 mb-4">{t("confirmationEmailSoon")}</p>
          <I18nLink href={`/tournaments/${tournamentId}`}>
            <Button>{t("backToTournament")}</Button>
          </I18nLink>
        </div>
      </div>
    );
  }

  return (
    <TournamentLayout tournamentId={tournamentId} activeTab="register">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Tournament Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {registrationInfo.tournament.name}
          </h1>
          <p className="text-gray-600">
            {registrationInfo.tournament.location.city},{" "}
            {registrationInfo.tournament.location.country.name}
          </p>
          <p className="text-sm text-gray-500">
            {new Date(
              registrationInfo.tournament.startDate
            ).toLocaleDateString()}{" "}
            -{" "}
            {new Date(registrationInfo.tournament.endDate).toLocaleDateString()}
          </p>
        </div>

        {/* Registration Information */}
        {registrationInfo.tournament.registrationInfo && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{t("registrationInformation")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="prose prose-gray max-w-none"
                dangerouslySetInnerHTML={{
                  __html: registrationInfo.tournament.registrationInfo,
                }}
              />
            </CardContent>
          </Card>
        )}

        {/* Success Message for Save and Create Another */}
        {showSuccessMessage && (
          <Card
            className="mb-6 border-green-200 bg-green-50"
            data-testid="success-message"
          >
            <CardContent className="pt-6">
              <div className="flex items-center text-green-800">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span className="font-medium">
                  {t("registrationSubmittedAnotherTeam")}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Registration Form */}
        <Card>
          <CardHeader>
            <CardTitle>{t("teamRegistrationForm")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Team Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {t("team")}
                </h3>

                {/* Team Name */}
                <div>
                  <Label htmlFor="teamName">{t("team")}</Label>
                  <Input
                    id="teamName"
                    name="teamName"
                    data-testid="team-name-input"
                    value={formData.teamName}
                    onChange={(e) =>
                      handleInputChange("teamName", e.target.value)
                    }
                    placeholder={t("enterTeamName")}
                    required
                  />
                </div>

                {/* Team Logo Upload */}
                <TeamLogoUpload
                  logo={formData.teamLogo}
                  onLogoChange={(logo) => handleInputChange("teamLogo", logo)}
                />

                {/* Club Selection */}
                {!showNewClubForm ? (
                  <div>
                    <Label className="block text-sm font-medium mb-2">
                      {t("club")}
                    </Label>
                    <ClubSelector
                      selectedClubId={formData.clubId}
                      onClubChange={(clubId, clubName) => {
                        handleInputChange("clubId", clubId);
                        handleInputChange("club", clubName);
                        handleInputChange("clubSelectionType", "existing");
                      }}
                      onNewClub={() => setShowNewClubForm(true)}
                      country={
                        registrationInfo.tournament.location.country.name
                      }
                    />
                  </div>
                ) : (
                  <div>
                    <Label className="block text-sm font-medium mb-2">
                      Add New Club
                    </Label>
                    <div className="space-y-4">
                      <div>
                        <Label
                          htmlFor="newClubName"
                          className="block text-sm font-medium mb-1"
                        >
                          Club Name *
                        </Label>
                        <Input
                          id="newClubName"
                          type="text"
                          value={formData.club}
                          onChange={(e) => {
                            handleInputChange("club", e.target.value);
                            handleInputChange("clubSelectionType", "new");
                          }}
                          placeholder="Enter club name"
                          required
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowNewClubForm(false)}
                      >
                        Back to Club Selection
                      </Button>
                    </div>
                  </div>
                )}

                {/* Division Selection */}
                <div>
                  <Label htmlFor="division">{t("series")}</Label>
                  <Select
                    value={formData.divisionId}
                    onValueChange={(value) =>
                      handleInputChange("divisionId", value)
                    }
                  >
                    <SelectTrigger data-testid="division-select">
                      <SelectValue placeholder={t("selectDivision")} />
                    </SelectTrigger>
                    <SelectContent>
                      {registrationInfo.tournament.divisions.map((division) => (
                        <SelectItem
                          key={division.id}
                          value={division.id}
                          data-testid="division-option"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{division.name}</span>
                            <span className="text-sm text-gray-500">
                              {division.level} •{" "}
                              {division.birthYear
                                ? t("bornYear", { year: division.birthYear })
                                : ""}{" "}
                              • {division.format || t("standard")}
                              {division.registrationFee
                                ? ` • ${division.registrationFee.amount} ${division.registrationFee.currency}`
                                : ` • ${t("free")}`}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Contact Person Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {t("teamContactPerson")}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contactFirstName">{t("firstName")}</Label>
                    <Input
                      id="contactFirstName"
                      name="contactFirstName"
                      data-testid="contact-first-name-input"
                      value={formData.contactFirstName}
                      onChange={(e) =>
                        handleInputChange("contactFirstName", e.target.value)
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="contactLastName">{t("lastName")}</Label>
                    <Input
                      id="contactLastName"
                      name="contactLastName"
                      data-testid="contact-last-name-input"
                      value={formData.contactLastName}
                      onChange={(e) =>
                        handleInputChange("contactLastName", e.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="contactAddress">{t("address")}</Label>
                    <Input
                      id="contactAddress"
                      name="contactAddress"
                      data-testid="contact-address-input"
                      value={formData.contactAddress}
                      onChange={(e) =>
                        handleInputChange("contactAddress", e.target.value)
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="contactPostalCode">{t("postalCode")}</Label>
                    <Input
                      id="contactPostalCode"
                      name="contactPostalCode"
                      data-testid="contact-postal-code-input"
                      value={formData.contactPostalCode}
                      onChange={(e) =>
                        handleInputChange("contactPostalCode", e.target.value)
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="contactCity">{t("city")}</Label>
                    <Input
                      id="contactCity"
                      name="contactCity"
                      data-testid="contact-city-input"
                      value={formData.contactCity}
                      onChange={(e) =>
                        handleInputChange("contactCity", e.target.value)
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="contactPhone">{t("phone")}</Label>
                    <Input
                      id="contactPhone"
                      name="contactPhone"
                      data-testid="contact-phone-input"
                      type="tel"
                      value={formData.contactPhone}
                      onChange={(e) =>
                        handleInputChange("contactPhone", e.target.value)
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="contactEmail">{t("email")}</Label>
                    <Input
                      id="contactEmail"
                      name="contactEmail"
                      data-testid="contact-email-input"
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) =>
                        handleInputChange("contactEmail", e.target.value)
                      }
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Terms Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {t("termsOfUse")}
                </h3>

                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="acceptTerms"
                      name="acceptTerms"
                      data-testid="accept-terms-checkbox"
                      checked={formData.acceptTerms}
                      onCheckedChange={(checked) =>
                        handleInputChange("acceptTerms", checked as boolean)
                      }
                      required
                    />
                    <Label htmlFor="acceptTerms" className="text-sm">
                      {t("termsAcceptance")}
                    </Label>
                  </div>
                  <I18nLink
                    href="/privacy-policy"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {t("viewPrivacyPolicy")}
                  </I18nLink>
                </div>
              </div>

              {/* Billing Address Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {t("billingAddressDifferent")}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="billingName">{t("name")}</Label>
                    <Input
                      id="billingName"
                      name="billingName"
                      data-testid="billing-name-input"
                      value={formData.billingName}
                      onChange={(e) =>
                        handleInputChange("billingName", e.target.value)
                      }
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="billingAddress">{t("address")}</Label>
                    <Input
                      id="billingAddress"
                      name="billingAddress"
                      data-testid="billing-address-input"
                      value={formData.billingAddress}
                      onChange={(e) =>
                        handleInputChange("billingAddress", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="billingPostalCode">{t("postalCode")}</Label>
                    <Input
                      id="billingPostalCode"
                      name="billingPostalCode"
                      data-testid="billing-postal-code-input"
                      value={formData.billingPostalCode}
                      onChange={(e) =>
                        handleInputChange("billingPostalCode", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="billingCity">{t("city")}</Label>
                    <Input
                      id="billingCity"
                      name="billingCity"
                      data-testid="billing-city-input"
                      value={formData.billingCity}
                      onChange={(e) =>
                        handleInputChange("billingCity", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="billingEmail">{t("email")}</Label>
                    <Input
                      id="billingEmail"
                      name="billingEmail"
                      data-testid="billing-email-input"
                      type="email"
                      value={formData.billingEmail}
                      onChange={(e) =>
                        handleInputChange("billingEmail", e.target.value)
                      }
                    />
                  </div>
                </div>

                <p className="text-sm text-gray-500">
                  {t("preliminaryAmount")}
                </p>
              </div>

              {/* Cost Summary */}
              {selectedDivision && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {t("costSummary")}
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span>{t("teamFee")}</span>
                      <span className="font-semibold">
                        {selectedDivision.registrationFee
                          ? `${selectedDivision.registrationFee.amount} ${selectedDivision.registrationFee.currency}`
                          : "0.00 €"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t">
                      <span className="font-semibold">{t("total")}</span>
                      <span className="font-semibold text-lg">
                        {selectedDivision.registrationFee
                          ? `${selectedDivision.registrationFee.amount} ${selectedDivision.registrationFee.currency}`
                          : "0.00 €"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* reCAPTCHA Placeholder */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="recaptcha" />
                  <Label htmlFor="recaptcha" className="text-sm">
                    {t("notARobot")}
                  </Label>
                </div>
                <div className="text-xs text-gray-500">
                  <I18nLink href="/privacy" className="hover:underline">
                    {t("privacy")}
                  </I18nLink>{" "}
                  |
                  <I18nLink href="/terms" className="hover:underline ml-1">
                    {t("terms")}
                  </I18nLink>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                    <p className="text-red-700">{error}</p>
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-4 space-y-3">
                <Button
                  type="submit"
                  data-testid="submit-button"
                  className="w-full"
                  disabled={submitting || !formData.acceptTerms}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t("submitting")}
                    </>
                  ) : (
                    t("sendRegistration")
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  data-testid="save-and-create-another-button"
                  className="w-full"
                  disabled={submitting || !formData.acceptTerms}
                  onClick={() => {
                    setSaveAndCreateAnother(true);
                    // Trigger form submission
                    const form = document.querySelector("form");
                    if (form) {
                      form.requestSubmit();
                    }
                  }}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t("submitting")}
                    </>
                  ) : (
                    t("sendAndCreateAnother")
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </TournamentLayout>
  );
}
