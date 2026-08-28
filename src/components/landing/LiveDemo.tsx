"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { Phone, Loader2, Wrench, Utensils, Stethoscope, Scissors, Building2, Truck, Sparkles, CheckCircle2, ShoppingBag, ChevronDown, Search, Check } from "lucide-react";
import { LeadCapturePopup } from "./LeadCapturePopup";
import { ToastNotification, ToastMessage } from "@/components/shared/toast-notification";

export interface CountryCode {
  code: string;
  dialCode: string;
  name: string;
  flag: string;
  format: string;
}

export const COUNTRY_CODES: CountryCode[] = [
  // Popular / Featured
  { code: "PK", dialCode: "+92", name: "Pakistan", flag: "🇵🇰", format: "300 1234567" },
  { code: "US", dialCode: "+1", name: "United States", flag: "🇺🇸", format: "202 555 0123" },
  { code: "GB", dialCode: "+44", name: "United Kingdom", flag: "🇬🇧", format: "7911 123456" },
  { code: "AE", dialCode: "+971", name: "United Arab Emirates", flag: "🇦🇪", format: "50 123 4567" },
  { code: "SA", dialCode: "+966", name: "Saudi Arabia", flag: "🇸🇦", format: "50 123 4567" },
  { code: "CA", dialCode: "+1", name: "Canada", flag: "🇨🇦", format: "416 555 0123" },
  { code: "AU", dialCode: "+61", name: "Australia", flag: "🇦🇺", format: "412 345 678" },
  { code: "IN", dialCode: "+91", name: "India", flag: "🇮🇳", format: "98765 43210" },
  { code: "IE", dialCode: "+353", name: "Ireland", flag: "🇮🇪", format: "87 123 4567" },
  
  // All World Countries (Alphabetical)
  { code: "AF", dialCode: "+93", name: "Afghanistan", flag: "🇦🇫", format: "70 123 4567" },
  { code: "AL", dialCode: "+355", name: "Albania", flag: "🇦🇱", format: "67 123 4567" },
  { code: "DZ", dialCode: "+213", name: "Algeria", flag: "🇩🇿", format: "550 12 34 56" },
  { code: "AD", dialCode: "+376", name: "Andorra", flag: "🇦🇩", format: "312 345" },
  { code: "AO", dialCode: "+244", name: "Angola", flag: "🇦🇴", format: "912 345 678" },
  { code: "AG", dialCode: "+1268", name: "Antigua and Barbuda", flag: "🇦🇬", format: "464 1234" },
  { code: "AR", dialCode: "+54", name: "Argentina", flag: "🇦🇷", format: "9 11 1234 5678" },
  { code: "AM", dialCode: "+374", name: "Armenia", flag: "🇦🇲", format: "10 123456" },
  { code: "AT", dialCode: "+43", name: "Austria", flag: "🇦🇹", format: "644 123456" },
  { code: "AZ", dialCode: "+994", name: "Azerbaijan", flag: "🇦🇿", format: "50 123 45 67" },
  { code: "BS", dialCode: "+1242", name: "Bahamas", flag: "🇧🇸", format: "359 1234" },
  { code: "BH", dialCode: "+973", name: "Bahrain", flag: "🇧🇭", format: "3612 3456" },
  { code: "BD", dialCode: "+880", name: "Bangladesh", flag: "🇧🇩", format: "1712 345678" },
  { code: "BB", dialCode: "+1246", name: "Barbados", flag: "🇧🇧", format: "262 1234" },
  { code: "BY", dialCode: "+375", name: "Belarus", flag: "🇧🇾", format: "29 123 45 67" },
  { code: "BE", dialCode: "+32", name: "Belgium", flag: "🇧🇪", format: "470 12 34 56" },
  { code: "BZ", dialCode: "+501", name: "Belize", flag: "🇧🇿", format: "622 1234" },
  { code: "BJ", dialCode: "+229", name: "Benin", flag: "🇧🇯", format: "90 12 34 56" },
  { code: "BT", dialCode: "+975", name: "Bhutan", flag: "🇧🇹", format: "17 12 34 56" },
  { code: "BO", dialCode: "+591", name: "Bolivia", flag: "🇧🇴", format: "7123 4567" },
  { code: "BA", dialCode: "+387", name: "Bosnia and Herzegovina", flag: "🇧🇦", format: "61 123 456" },
  { code: "BW", dialCode: "+267", name: "Botswana", flag: "🇧🇼", format: "71 123 456" },
  { code: "BR", dialCode: "+55", name: "Brazil", flag: "🇧🇷", format: "11 91234 5678" },
  { code: "BN", dialCode: "+673", name: "Brunei", flag: "🇧🇳", format: "712 3456" },
  { code: "BG", dialCode: "+359", name: "Bulgaria", flag: "🇧🇬", format: "87 123 4567" },
  { code: "BF", dialCode: "+226", name: "Burkina Faso", flag: "🇧🇫", format: "70 12 34 56" },
  { code: "BI", dialCode: "+257", name: "Burundi", flag: "🇧🇮", format: "79 12 34 56" },
  { code: "KH", dialCode: "+855", name: "Cambodia", flag: "🇰🇭", format: "12 345 678" },
  { code: "CM", dialCode: "+237", name: "Cameroon", flag: "🇨🇲", format: "6 71 23 45 67" },
  { code: "CV", dialCode: "+238", name: "Cape Verde", flag: "🇨🇻", format: "991 12 34" },
  { code: "CF", dialCode: "+236", name: "Central African Republic", flag: "🇨🇫", format: "70 01 23 45" },
  { code: "TD", dialCode: "+235", name: "Chad", flag: "🇹🇩", format: "63 01 23 45" },
  { code: "CL", dialCode: "+56", name: "Chile", flag: "🇨🇱", format: "9 1234 5678" },
  { code: "CN", dialCode: "+86", name: "China", flag: "🇨🇳", format: "139 1234 5678" },
  { code: "CO", dialCode: "+57", name: "Colombia", flag: "🇨🇴", format: "300 123 4567" },
  { code: "KM", dialCode: "+269", name: "Comoros", flag: "🇰🇲", format: "321 23 45" },
  { code: "CG", dialCode: "+242", name: "Congo - Brazzaville", flag: "🇨🇬", format: "06 123 4567" },
  { code: "CD", dialCode: "+243", name: "Congo - Kinshasa", flag: "🇨🇩", format: "99 123 4567" },
  { code: "CR", dialCode: "+506", name: "Costa Rica", flag: "🇨🇷", format: "8312 3456" },
  { code: "HR", dialCode: "+385", name: "Croatia", flag: "🇭🇷", format: "91 123 4567" },
  { code: "CU", dialCode: "+53", name: "Cuba", flag: "🇨🇺", format: "5 1234567" },
  { code: "CY", dialCode: "+357", name: "Cyprus", flag: "🇨🇾", format: "99 123456" },
  { code: "CZ", dialCode: "+420", name: "Czech Republic", flag: "🇨🇿", format: "601 123 456" },
  { code: "DK", dialCode: "+45", name: "Denmark", flag: "🇩🇰", format: "20 12 34 56" },
  { code: "DJ", dialCode: "+253", name: "Djibouti", flag: "🇩🇯", format: "77 12 34 56" },
  { code: "DM", dialCode: "+1767", name: "Dominica", flag: "🇩🇲", format: "235 1234" },
  { code: "DO", dialCode: "+1809", name: "Dominican Republic", flag: "🇩🇴", format: "220 1234" },
  { code: "EC", dialCode: "+593", name: "Ecuador", flag: "🇪🇨", format: "99 123 4567" },
  { code: "EG", dialCode: "+20", name: "Egypt", flag: "🇪🇬", format: "10 1234 5678" },
  { code: "SV", dialCode: "+503", name: "El Salvador", flag: "🇸🇻", format: "7012 3456" },
  { code: "GQ", dialCode: "+240", name: "Equatorial Guinea", flag: "🇬🇶", format: "222 123 456" },
  { code: "ER", dialCode: "+291", name: "Eritrea", flag: "🇪🇷", format: "7 123 456" },
  { code: "EE", dialCode: "+372", name: "Estonia", flag: "🇪🇪", format: "5123 4567" },
  { code: "SZ", dialCode: "+268", name: "Eswatini", flag: "🇸🇿", format: "7612 3456" },
  { code: "ET", dialCode: "+251", name: "Ethiopia", flag: "🇪🇹", format: "91 123 4567" },
  { code: "FJ", dialCode: "+679", name: "Fiji", flag: "🇫🇯", format: "701 2345" },
  { code: "FI", dialCode: "+358", name: "Finland", flag: "🇫🇮", format: "45 1234567" },
  { code: "FR", dialCode: "+33", name: "France", flag: "🇫🇷", format: "6 12 34 56 78" },
  { code: "GA", dialCode: "+241", name: "Gabon", flag: "🇬🇦", format: "06 12 34 56" },
  { code: "GM", dialCode: "+220", name: "Gambia", flag: "🇬🇲", format: "701 2345" },
  { code: "GE", dialCode: "+995", name: "Georgia", flag: "🇬🇪", format: "599 12 34 56" },
  { code: "DE", dialCode: "+49", name: "Germany", flag: "🇩🇪", format: "151 23456789" },
  { code: "GH", dialCode: "+233", name: "Ghana", flag: "🇬🇭", format: "24 123 4567" },
  { code: "GR", dialCode: "+30", name: "Greece", flag: "🇬🇷", format: "691 234 5678" },
  { code: "GD", dialCode: "+1473", name: "Grenada", flag: "🇬🇩", format: "403 1234" },
  { code: "GT", dialCode: "+502", name: "Guatemala", flag: "🇬🇹", format: "5123 4567" },
  { code: "GN", dialCode: "+224", name: "Guinea", flag: "🇬🇳", format: "621 12 34 56" },
  { code: "GW", dialCode: "+245", name: "Guinea-Bissau", flag: "🇬🇼", format: "955 12 34 56" },
  { code: "GY", dialCode: "+592", name: "Guyana", flag: "🇬🇾", format: "609 1234" },
  { code: "HT", dialCode: "+509", name: "Haiti", flag: "🇭🇹", format: "34 12 3456" },
  { code: "HN", dialCode: "+504", name: "Honduras", flag: "🇭🇳", format: "9123 4567" },
  { code: "HK", dialCode: "+852", name: "Hong Kong SAR", flag: "🇭🇰", format: "9123 4567" },
  { code: "HU", dialCode: "+36", name: "Hungary", flag: "🇭🇺", format: "20 123 4567" },
  { code: "IS", dialCode: "+354", name: "Iceland", flag: "🇮🇸", format: "612 3456" },
  { code: "ID", dialCode: "+62", name: "Indonesia", flag: "🇮🇩", format: "812 3456 7890" },
  { code: "IR", dialCode: "+98", name: "Iran", flag: "🇮🇷", format: "912 345 6789" },
  { code: "IQ", dialCode: "+964", name: "Iraq", flag: "🇮🇶", format: "790 123 4567" },
  { code: "IL", dialCode: "+972", name: "Israel", flag: "🇮🇱", format: "50 123 4567" },
  { code: "IT", dialCode: "+39", name: "Italy", flag: "🇮🇹", format: "312 345 6789" },
  { code: "JM", dialCode: "+1876", name: "Jamaica", flag: "🇯🇲", format: "210 1234" },
  { code: "JP", dialCode: "+81", name: "Japan", flag: "🇯🇵", format: "90 1234 5678" },
  { code: "JO", dialCode: "+962", name: "Jordan", flag: "🇯🇴", format: "7 9012 3456" },
  { code: "KZ", dialCode: "+7", name: "Kazakhstan", flag: "🇰🇿", format: "701 123 4567" },
  { code: "KE", dialCode: "+254", name: "Kenya", flag: "🇰🇪", format: "712 345678" },
  { code: "KI", dialCode: "+686", name: "Kiribati", flag: "🇰🇮", format: "730 12345" },
  { code: "KR", dialCode: "+82", name: "South Korea", flag: "🇰🇷", format: "10 1234 5678" },
  { code: "KW", dialCode: "+965", name: "Kuwait", flag: "🇰🇼", format: "9123 4567" },
  { code: "KG", dialCode: "+996", name: "Kyrgyzstan", flag: "🇰🇬", format: "700 123 456" },
  { code: "LA", dialCode: "+856", name: "Laos", flag: "🇱🇦", format: "20 12 345 678" },
  { code: "LV", dialCode: "+371", name: "Latvia", flag: "🇱🇻", format: "21 234 567" },
  { code: "LB", dialCode: "+961", name: "Lebanon", flag: "🇱🇧", format: "71 123 456" },
  { code: "LS", dialCode: "+266", name: "Lesotho", flag: "🇱🇸", format: "5012 3456" },
  { code: "LR", dialCode: "+231", name: "Liberia", flag: "🇱🇷", format: "77 012 3456" },
  { code: "LY", dialCode: "+218", name: "Libya", flag: "🇱🇾", format: "91 123 4567" },
  { code: "LI", dialCode: "+423", name: "Liechtenstein", flag: "🇱🇮", format: "79 123 45" },
  { code: "LT", dialCode: "+370", name: "Lithuania", flag: "🇱🇹", format: "612 34567" },
  { code: "LU", dialCode: "+352", name: "Luxembourg", flag: "🇱🇺", format: "621 123 456" },
  { code: "MO", dialCode: "+853", name: "Macau SAR", flag: "🇲🇴", format: "6123 4567" },
  { code: "MG", dialCode: "+261", name: "Madagascar", flag: "🇲🇬", format: "32 12 345 67" },
  { code: "MW", dialCode: "+265", name: "Malawi", flag: "🇲🇼", format: "99 123 4567" },
  { code: "MY", dialCode: "+60", name: "Malaysia", flag: "🇲🇾", format: "12 345 6789" },
  { code: "MV", dialCode: "+960", name: "Maldives", flag: "🇲🇻", format: "712 3456" },
  { code: "ML", dialCode: "+223", name: "Mali", flag: "🇲🇱", format: "65 01 23 45" },
  { code: "MT", dialCode: "+356", name: "Malta", flag: "🇲🇹", format: "9912 3456" },
  { code: "MH", dialCode: "+692", name: "Marshall Islands", flag: "🇲🇭", format: "247 1234" },
  { code: "MR", dialCode: "+222", name: "Mauritania", flag: "🇲🇷", format: "22 12 34 56" },
  { code: "MU", dialCode: "+230", name: "Mauritius", flag: "🇲🇺", format: "5123 4567" },
  { code: "MX", dialCode: "+52", name: "Mexico", flag: "🇲🇽", format: "55 1234 5678" },
  { code: "FM", dialCode: "+691", name: "Micronesia", flag: "🇫🇲", format: "920 1234" },
  { code: "MD", dialCode: "+373", name: "Moldova", flag: "🇲🇩", format: "621 12 345" },
  { code: "MC", dialCode: "+377", name: "Monaco", flag: "🇲🇨", format: "6 12 34 56 78" },
  { code: "MN", dialCode: "+976", name: "Mongolia", flag: "🇲🇳", format: "8812 3456" },
  { code: "ME", dialCode: "+382", name: "Montenegro", flag: "🇲🇪", format: "67 123 456" },
  { code: "MA", dialCode: "+212", name: "Morocco", flag: "🇲🇦", format: "650 123456" },
  { code: "MZ", dialCode: "+258", name: "Mozambique", flag: "🇲🇿", format: "82 123 4567" },
  { code: "MM", dialCode: "+95", name: "Myanmar (Burma)", flag: "🇲🇲", format: "9 123 45678" },
  { code: "NA", dialCode: "+264", name: "Namibia", flag: "🇳🇦", format: "81 123 4567" },
  { code: "NR", dialCode: "+674", name: "Nauru", flag: "🇳🇷", format: "555 1234" },
  { code: "NP", dialCode: "+977", name: "Nepal", flag: "🇳🇵", format: "984 1234567" },
  { code: "NL", dialCode: "+31", name: "Netherlands", flag: "🇳🇱", format: "6 12345678" },
  { code: "NZ", dialCode: "+64", name: "New Zealand", flag: "🇳🇿", format: "21 123 4567" },
  { code: "NI", dialCode: "+505", name: "Nicaragua", flag: "🇳🇮", format: "8123 4567" },
  { code: "NE", dialCode: "+227", name: "Niger", flag: "🇳🇪", format: "93 12 34 56" },
  { code: "NG", dialCode: "+234", name: "Nigeria", flag: "🇳🇬", format: "803 123 4567" },
  { code: "MK", dialCode: "+389", name: "North Macedonia", flag: "🇲🇰", format: "70 123 456" },
  { code: "NO", dialCode: "+47", name: "Norway", flag: "🇳🇴", format: "412 34 567" },
  { code: "OM", dialCode: "+968", name: "Oman", flag: "🇴🇲", format: "9123 4567" },
  { code: "PW", dialCode: "+680", name: "Palau", flag: "🇵🇼", format: "775 1234" },
  { code: "PS", dialCode: "+970", name: "Palestine", flag: "🇵🇸", format: "599 123 456" },
  { code: "PA", dialCode: "+507", name: "Panama", flag: "🇵🇦", format: "6123 4567" },
  { code: "PG", dialCode: "+675", name: "Papua New Guinea", flag: "🇵🇬", format: "7012 3456" },
  { code: "PY", dialCode: "+595", name: "Paraguay", flag: "🇵🇾", format: "981 123456" },
  { code: "PE", dialCode: "+51", name: "Peru", flag: "🇵🇪", format: "912 345 678" },
  { code: "PH", dialCode: "+63", name: "Philippines", flag: "🇵🇭", format: "917 123 4567" },
  { code: "PL", dialCode: "+48", name: "Poland", flag: "🇵🇱", format: "512 345 678" },
  { code: "PT", dialCode: "+351", name: "Portugal", flag: "🇵🇹", format: "912 345 678" },
  { code: "QA", dialCode: "+974", name: "Qatar", flag: "🇶🇦", format: "3312 3456" },
  { code: "RO", dialCode: "+40", name: "Romania", flag: "🇷🇴", format: "712 345 678" },
  { code: "RU", dialCode: "+7", name: "Russia", flag: "🇷🇺", format: "912 345 6789" },
  { code: "RW", dialCode: "+250", name: "Rwanda", flag: "🇷🇼", format: "788 123 456" },
  { code: "KN", dialCode: "+1869", name: "Saint Kitts and Nevis", flag: "🇰🇳", format: "465 1234" },
  { code: "LC", dialCode: "+1758", name: "Saint Lucia", flag: "🇱🇨", format: "455 1234" },
  { code: "VC", dialCode: "+1784", name: "Saint Vincent", flag: "🇻🇨", format: "456 1234" },
  { code: "WS", dialCode: "+685", name: "Samoa", flag: "🇼🇸", format: "721 2345" },
  { code: "SM", dialCode: "+378", name: "San Marino", flag: "🇸🇲", format: "66 123456" },
  { code: "ST", dialCode: "+239", name: "São Tomé and Príncipe", flag: "🇸🇹", format: "981 2345" },
  { code: "SN", dialCode: "+221", name: "Senegal", flag: "🇸🇳", format: "77 123 45 67" },
  { code: "RS", dialCode: "+381", name: "Serbia", flag: "🇷🇸", format: "61 1234567" },
  { code: "SC", dialCode: "+248", name: "Seychelles", flag: "🇸🇨", format: "2 51 23 45" },
  { code: "SL", dialCode: "+232", name: "Sierra Leone", flag: "🇸🇱", format: "76 123456" },
  { code: "SG", dialCode: "+65", name: "Singapore", flag: "🇸🇬", format: "8123 4567" },
  { code: "SK", dialCode: "+421", name: "Slovakia", flag: "🇸🇰", format: "912 345 678" },
  { code: "SI", dialCode: "+386", name: "Slovenia", flag: "🇸🇮", format: "41 123 456" },
  { code: "SB", dialCode: "+677", name: "Solomon Islands", flag: "🇸🇧", format: "741 2345" },
  { code: "SO", dialCode: "+252", name: "Somalia", flag: "🇸🇴", format: "61 1234567" },
  { code: "ZA", dialCode: "+27", name: "South Africa", flag: "🇿🇦", format: "82 123 4567" },
  { code: "SS", dialCode: "+211", name: "South Sudan", flag: "🇸🇸", format: "912 345 678" },
  { code: "ES", dialCode: "+34", name: "Spain", flag: "🇪🇸", format: "612 34 56 78" },
  { code: "LK", dialCode: "+94", name: "Sri Lanka", flag: "🇱🇰", format: "71 123 4567" },
  { code: "SD", dialCode: "+249", name: "Sudan", flag: "🇸🇩", format: "91 123 4567" },
  { code: "SR", dialCode: "+597", name: "Suriname", flag: "🇸🇷", format: "812 3456" },
  { code: "SE", dialCode: "+46", name: "Sweden", flag: "🇸🇪", format: "70 123 45 67" },
  { code: "CH", dialCode: "+41", name: "Switzerland", flag: "🇨🇭", format: "79 123 45 67" },
  { code: "SY", dialCode: "+963", name: "Syria", flag: "🇸🇾", format: "912 345 678" },
  { code: "TW", dialCode: "+886", name: "Taiwan", flag: "🇹🇼", format: "912 345 678" },
  { code: "TJ", dialCode: "+992", name: "Tajikistan", flag: "🇹🇯", format: "918 12 34 56" },
  { code: "TZ", dialCode: "+255", name: "Tanzania", flag: "🇹🇿", format: "712 345 678" },
  { code: "TH", dialCode: "+66", name: "Thailand", flag: "🇹🇭", format: "81 234 5678" },
  { code: "TL", dialCode: "+670", name: "Timor-Leste", flag: "🇹🇱", format: "7712 3456" },
  { code: "TG", dialCode: "+228", name: "Togo", flag: "🇹🇬", format: "90 12 34 56" },
  { code: "TO", dialCode: "+676", name: "Tonga", flag: "🇹🇴", format: "771 2345" },
  { code: "TT", dialCode: "+1868", name: "Trinidad and Tobago", flag: "🇹🇹", format: "620 1234" },
  { code: "TN", dialCode: "+216", name: "Tunisia", flag: "🇹🇳", format: "20 123 456" },
  { code: "TR", dialCode: "+90", name: "Turkey", flag: "🇹🇷", format: "501 234 56 78" },
  { code: "TM", dialCode: "+993", name: "Turkmenistan", flag: "🇹🇲", format: "65 123456" },
  { code: "TV", dialCode: "+688", name: "Tuvalu", flag: "🇹🇻", format: "901 234" },
  { code: "UG", dialCode: "+256", name: "Uganda", flag: "🇺🇬", format: "712 345678" },
  { code: "UA", dialCode: "+380", name: "Ukraine", flag: "🇺🇦", format: "50 123 4567" },
  { code: "UY", dialCode: "+598", name: "Uruguay", flag: "🇺🇾", format: "99 123 456" },
  { code: "UZ", dialCode: "+998", name: "Uzbekistan", flag: "🇺🇿", format: "90 123 45 67" },
  { code: "VU", dialCode: "+678", name: "Vanuatu", flag: "🇻🇺", format: "591 2345" },
  { code: "VE", dialCode: "+58", name: "Venezuela", flag: "🇻🇪", format: "412 1234567" },
  { code: "VN", dialCode: "+84", name: "Vietnam", flag: "🇻🇳", format: "91 234 56 78" },
  { code: "YE", dialCode: "+967", name: "Yemen", flag: "🇾🇪", format: "712 345 678" },
  { code: "ZM", dialCode: "+260", name: "Zambia", flag: "🇿🇲", format: "95 5123456" },
  { code: "ZW", dialCode: "+263", name: "Zimbabwe", flag: "🇿🇼", format: "71 234 5678" },
];

export function formatToE164(dialCode: string, inputNumber: string): { e164: string; isValid: boolean } {
  const trimmed = inputNumber.trim();
  if (!trimmed) return { e164: "", isValid: false };

  if (trimmed.startsWith("+")) {
    const cleanedDigits = trimmed.replace(/[^\d+]/g, "");
    const isValid = /^\+[1-9]\d{7,14}$/.test(cleanedDigits);
    return { e164: cleanedDigits, isValid };
  }

  let cleaned = trimmed.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = cleaned.substring(1);
  }

  const dialDigits = dialCode.replace(/\D/g, "");
  if (cleaned.startsWith(dialDigits)) {
    const e164 = `+${cleaned}`;
    const isValid = /^\+[1-9]\d{7,14}$/.test(e164);
    return { e164, isValid };
  }

  const e164 = `${dialCode}${cleaned}`;
  const isValid = /^\+[1-9]\d{7,14}$/.test(e164);
  return { e164, isValid };
}

interface CountrySelectorDropdownProps {
  selectedCountry: CountryCode;
  onSelectCountry: (country: CountryCode) => void;
  disabled?: boolean;
}

export function CountrySelectorDropdown({
  selectedCountry,
  onSelectCountry,
  disabled = false,
}: CountrySelectorDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCountries = useMemo(() => {
    if (!search.trim()) return COUNTRY_CODES;
    const q = search.toLowerCase().trim();
    return COUNTRY_CODES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <div ref={dropdownRef} className="relative shrink-0 sm:w-48">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-full px-4 py-4 rounded-2xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-white text-xs sm:text-sm font-bold flex items-center justify-between gap-2 transition-all cursor-pointer disabled:opacity-50"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <img
            src={`https://flagcdn.com/w40/${selectedCountry.code.toLowerCase()}.png`}
            alt={selectedCountry.name}
            className="w-5 h-3.5 rounded-xs object-cover shrink-0 shadow-xs"
          />
          <span className="font-mono text-emerald-400 font-bold">{selectedCountry.dialCode}</span>
          <span className="text-slate-300 text-xs truncate hidden xs:inline">
            {selectedCountry.code}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 sm:w-80 max-w-[calc(100vw-2.5rem)] bg-slate-950/98 backdrop-blur-2xl border border-slate-700 rounded-2xl shadow-2xl z-50 p-2.5 animate-in fade-in duration-150">
          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              autoFocus
              placeholder="Search country or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="max-h-44 overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-950">
            {filteredCountries.length === 0 ? (
              <div className="p-3 text-center text-slate-500 text-xs">No matching countries</div>
            ) : (
              filteredCountries.map((c, idx) => {
                const isSelected = c.code === selectedCountry.code;
                return (
                  <button
                    key={`${c.code}-${idx}`}
                    type="button"
                    onClick={() => {
                      onSelectCountry(c);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30"
                        : "hover:bg-slate-800 text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={`https://flagcdn.com/w40/${c.code.toLowerCase()}.png`}
                        alt={c.name}
                        className="w-5 h-3.5 rounded-xs object-cover shrink-0 shadow-xs"
                      />
                      <span className="font-mono text-emerald-400 font-bold shrink-0">{c.dialCode}</span>
                      <span className="text-slate-300 truncate">{c.name}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-2" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface Scenario {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  greeting: string;
  agentId: string;
}

export const HARDCODED_INDUSTRY_AGENTS: Record<string, string> = {
  restaurant: "agent_0bf18c457ce238b48c0fc332a4",
  salon: "agent_6f94e580d2a7d13bb139518f6c",
  "real-estate": "agent_78a02a3aa2ad7ba54e28b60257",
  plumber: "agent_36a031e8d639cbd81d5c8c5d79",
  healthcare: "agent_d6c151d28da24adbe81a614dfe",
  logistics: "agent_47a142e540f2dd26066b6a470d",
  retail: "agent_13683ec453095dafe0ecf51f66",
};

const scenarios: Scenario[] = [
  {
    id: "restaurant",
    name: "Restaurant Reservation & Orders",
    icon: Utensils,
    description: "Table bookings, takeout ordering, menu allergies & hours.",
    greeting: "Buona sera! Welcome to Bella Italia. Are you calling for a table reservation or takeout order?",
    agentId: HARDCODED_INDUSTRY_AGENTS["restaurant"],
  },
  {
    id: "salon",
    name: "Salon & Spa Booking",
    icon: Scissors,
    description: "Stylist calendar check, service packages, and deposit links.",
    greeting: "Hello! Welcome to Glow Salon & Spa. How can I help you book your appointment today?",
    agentId: HARDCODED_INDUSTRY_AGENTS["salon"],
  },
  {
    id: "real-estate",
    name: "Real Estate Buyer Qualification",
    icon: Building2,
    description: "Qualify buyers, open house RSVPs, and viewings scheduling.",
    greeting: "Hi there! Thanks for calling Premier Realty. Are you interested in scheduling a home viewing?",
    agentId: HARDCODED_INDUSTRY_AGENTS["real-estate"],
  },
  {
    id: "plumber",
    name: "Emergency Plumbing Service",
    icon: Wrench,
    description: "Emergency dispatch, pricing quotes, and job scheduling.",
    greeting: "Thanks for calling QuickFix Plumbing. Do you have an emergency repair or standard maintenance?",
    agentId: HARDCODED_INDUSTRY_AGENTS["plumber"],
  },
  {
    id: "healthcare",
    name: "Medical Clinic Reception",
    icon: Stethoscope,
    description: "HIPAA-compliant appointment booking, insurance queries, and clinic info.",
    greeting: "Hello, this is Bright Health Clinic. Are you calling to book an appointment or check office hours?",
    agentId: HARDCODED_INDUSTRY_AGENTS["healthcare"],
  },
  {
    id: "logistics",
    name: "Logistics & Dispatch",
    icon: Truck,
    description: "Driver check-ins, package tracking, and delivery rescheduling.",
    greeting: "Dispatch desk here. How can I assist with your shipment or delivery schedule?",
    agentId: HARDCODED_INDUSTRY_AGENTS["logistics"],
  },
  {
    id: "retail",
    name: "Retail & E-Commerce Support",
    icon: ShoppingBag,
    description: "Inventory status, return requests, and order tracking.",
    greeting: "Welcome to TrendStore Support! How can I help with your order or product question today?",
    agentId: HARDCODED_INDUSTRY_AGENTS["retail"],
  },
];

export interface LiveDemoProps {
  filterIndustryId?: string;
  colorTheme?: string;
}

const themeStyles: Record<string, {
  badgeBg: string;
  badgeIcon: string;
  glowBg: string;
  cardSelected: string;
  cardIconSelected: string;
  cardIconDefault: string;
  boxIconContainer: string;
  inputFocus: string;
  callBtn: string;
  dialingBtnText: string;
  statusBanner: string;
  statusIcon: string;
}> = {
  purple: {
    badgeBg: "bg-purple-500/10 border-purple-500/20 text-purple-400",
    badgeIcon: "text-purple-400",
    glowBg: "bg-purple-600/10",
    cardSelected: "bg-purple-600 border-purple-500 text-white shadow-xl shadow-purple-600/20 scale-[1.03]",
    cardIconSelected: "bg-white/20 text-white",
    cardIconDefault: "bg-slate-800 text-purple-400",
    boxIconContainer: "bg-purple-600/20 border-purple-500/30 text-purple-400",
    inputFocus: "focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20",
    callBtn: "bg-purple-600 hover:bg-purple-500 shadow-xl shadow-purple-600/30",
    dialingBtnText: "text-purple-400",
    statusBanner: "bg-purple-500/10 border-purple-500/20 text-purple-300",
    statusIcon: "text-purple-400",
  },
  orange: {
    badgeBg: "bg-orange-500/10 border-orange-500/20 text-orange-400",
    badgeIcon: "text-orange-400",
    glowBg: "bg-orange-600/10",
    cardSelected: "bg-orange-600 border-orange-500 text-white shadow-xl shadow-orange-600/20 scale-[1.03]",
    cardIconSelected: "bg-white/20 text-white",
    cardIconDefault: "bg-slate-800 text-orange-400",
    boxIconContainer: "bg-orange-600/20 border-orange-500/30 text-orange-400",
    inputFocus: "focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20",
    callBtn: "bg-orange-600 hover:bg-orange-500 shadow-xl shadow-orange-600/30",
    dialingBtnText: "text-orange-400",
    statusBanner: "bg-orange-500/10 border-orange-500/20 text-orange-300",
    statusIcon: "text-orange-400",
  },
  blue: {
    badgeBg: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    badgeIcon: "text-blue-400",
    glowBg: "bg-blue-600/10",
    cardSelected: "bg-blue-600 border-blue-500 text-white shadow-xl shadow-blue-600/20 scale-[1.03]",
    cardIconSelected: "bg-white/20 text-white",
    cardIconDefault: "bg-slate-800 text-blue-400",
    boxIconContainer: "bg-blue-600/20 border-blue-500/30 text-blue-400",
    inputFocus: "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
    callBtn: "bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-600/30",
    dialingBtnText: "text-blue-400",
    statusBanner: "bg-blue-500/10 border-blue-500/20 text-blue-300",
    statusIcon: "text-blue-400",
  },
  cyan: {
    badgeBg: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
    badgeIcon: "text-cyan-400",
    glowBg: "bg-cyan-600/10",
    cardSelected: "bg-cyan-600 border-cyan-500 text-white shadow-xl shadow-cyan-600/20 scale-[1.03]",
    cardIconSelected: "bg-white/20 text-white",
    cardIconDefault: "bg-slate-800 text-cyan-400",
    boxIconContainer: "bg-cyan-600/20 border-cyan-500/30 text-cyan-400",
    inputFocus: "focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20",
    callBtn: "bg-cyan-600 hover:bg-cyan-500 shadow-xl shadow-cyan-600/30",
    dialingBtnText: "text-cyan-400",
    statusBanner: "bg-cyan-500/10 border-cyan-500/20 text-cyan-300",
    statusIcon: "text-cyan-400",
  },
  green: {
    badgeBg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    badgeIcon: "text-emerald-400",
    glowBg: "bg-emerald-600/10",
    cardSelected: "bg-emerald-600 border-emerald-500 text-white shadow-xl shadow-emerald-600/20 scale-[1.03]",
    cardIconSelected: "bg-white/20 text-white",
    cardIconDefault: "bg-slate-800 text-emerald-400",
    boxIconContainer: "bg-emerald-600/20 border-emerald-500/30 text-emerald-400",
    inputFocus: "focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20",
    callBtn: "bg-emerald-600 hover:bg-emerald-500 shadow-xl shadow-emerald-600/30",
    dialingBtnText: "text-emerald-400",
    statusBanner: "bg-emerald-500/10 border-emerald-500/20 text-emerald-300",
    statusIcon: "text-emerald-400",
  },
  indigo: {
    badgeBg: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
    badgeIcon: "text-indigo-400",
    glowBg: "bg-indigo-600/10",
    cardSelected: "bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-600/20 scale-[1.03]",
    cardIconSelected: "bg-white/20 text-white",
    cardIconDefault: "bg-slate-800 text-indigo-400",
    boxIconContainer: "bg-indigo-600/20 border-indigo-500/30 text-indigo-400",
    inputFocus: "focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20",
    callBtn: "bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/30",
    dialingBtnText: "text-indigo-400",
    statusBanner: "bg-indigo-500/10 border-indigo-500/20 text-indigo-300",
    statusIcon: "text-indigo-400",
  },
};

export function LiveDemo({ filterIndustryId, colorTheme }: LiveDemoProps) {
  const availableScenarios = useMemo(() => {
    if (!filterIndustryId) return scenarios;
    const matches = scenarios.filter((sc) => sc.id === filterIndustryId);
    return matches.length > 0 ? matches : scenarios;
  }, [filterIndustryId]);

  const [selectedScenario, setSelectedScenario] = useState<Scenario>(
    availableScenarios[0] || scenarios[0]
  );

  useEffect(() => {
    if (availableScenarios.length > 0) {
      setSelectedScenario(availableScenarios[0]);
    }
  }, [filterIndustryId, availableScenarios]);

  const t = themeStyles[colorTheme as keyof typeof themeStyles] || themeStyles.indigo;

  // Phone Call Outbound Mode & Hot Lead Fields
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(COUNTRY_CODES[0]);
  const [userName, setUserName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [callingState, setCallingState] = useState<"idle" | "calling">("idle");
  const [hasTriggeredCall, setHasTriggeredCall] = useState(false);
  const [callStatusMessage, setCallStatusMessage] = useState("");
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const handleStartDemoClick = async () => {
    if (!userName || !userName.trim()) {
      setToast({
        id: Date.now().toString(),
        type: "error",
        title: "Name Required",
        message: "Please enter your name to start the live demo call.",
      });
      return;
    }

    const formatted = formatToE164(selectedCountry.dialCode, phoneNumber);

    if (!formatted.isValid) {
      setToast({
        id: Date.now().toString(),
        type: "error",
        title: "Invalid E.164 Phone Number",
        message: `Please enter a valid phone number. Standard E.164 format: ${formatted.e164 || selectedCountry.dialCode + "..."} (8-15 digits).`,
      });
      return;
    }

    const finalE164Number = formatted.e164;

    setCallingState("calling");
    setCallStatusMessage("Saving lead details & triggering demo call...");

    let customerId = "";

    // 1. Save lead to hot_leads table in database and extract the generated id
    try {
      const dbRes = await fetch("/api/hot-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: userName.trim(),
          number: finalE164Number,
          industry: selectedScenario.name,
        }),
      });

      const dbData = await dbRes.json();
      if (dbData?.customer_id) {
        customerId = String(dbData.customer_id);
      } else if (dbData?.id) {
        customerId = String(dbData.id);
      } else if (dbData?.data?.id) {
        customerId = String(dbData.data.id);
      } else if (Array.isArray(dbData?.data) && dbData.data[0]?.id) {
        customerId = String(dbData.data[0].id);
      }
    } catch (dbErr) {
      console.warn("Failed to save lead to hot_leads database table:", dbErr);
    }

    // 2. Determine agent_id (hardcoded per industry section)
    const agentId =
      selectedScenario.agentId ||
      HARDCODED_INDUSTRY_AGENTS[selectedScenario.id] ||
      "agent_default";

    // 3. Trigger n8n webhook for demo call
    const webhookUrl =
      process.env.NEXT_PUBLIC_N8N_TRIGGER_CALL_URL ||
      "https://n8n-dev.callautomate.ai/webhook/callautomate-trigger-call";

    const payload = {
      customer_id: customerId,
      name: userName.trim(),
      number: finalE164Number,
      agent_id: agentId,
    };

    console.log("Posting demo call trigger payload to n8n webhook:", payload);

    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        console.error("n8n demo call webhook error response:", res.status, errorText);
        setCallStatusMessage(`Call trigger sent to n8n (Status ${res.status}). Stand by for incoming call.`);
        setCallingState("idle");
        setHasTriggeredCall(true);
        setToast({
          id: Date.now().toString(),
          type: "info",
          title: "Call Request Sent",
          message: `Demo call requested for ${finalE164Number}. Please keep your phone nearby!`,
        });
      } else {
        setCallStatusMessage("Demo call triggered! Your phone should ring shortly.");
        setCallingState("idle");
        setHasTriggeredCall(true);
        setToast({
          id: Date.now().toString(),
          type: "success",
          title: "Demo Call Triggered! 📞",
          message: `AI Voice Receptionist is dialing ${finalE164Number}. Pick up to experience the demo!`,
        });
      }
    } catch (err: any) {
      console.error("n8n demo call trigger error:", err);
      setCallStatusMessage("Demo call initiated. Stand by for incoming call on your phone.");
      setCallingState("idle");
      setHasTriggeredCall(true);
      setToast({
        id: Date.now().toString(),
        type: "success",
        title: "Demo Call Initiated!",
        message: `Calling ${finalE164Number}... Stand by for your incoming AI phone call.`,
      });
    }
  };

  return (
    <section id="live-demo" className="py-24 bg-slate-900 text-white relative overflow-hidden">
      {/* Background radial glow */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] ${t.glowBg} rounded-full blur-3xl pointer-events-none`} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full ${t.badgeBg} text-xs font-bold uppercase tracking-wider mb-4`}>
            <Sparkles className={`w-3.5 h-3.5 ${t.badgeIcon}`} />
            <span>Interactive Voice Playground</span>
          </div>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight mb-4 break-words">
            Test Our AI Voice Agent Live
          </h2>
          <p className="text-slate-400 text-lg">
            {filterIndustryId
              ? "Enter your name & phone number to experience sub-300ms real-time voice automation tailored for your industry."
              : "Select an industry scenario, enter your name & phone number, and experience sub-300ms real-time voice automation."}
          </p>
        </div>

        {/* Scenario Selection Cards */}
        <div className={availableScenarios.length === 1 ? "flex justify-center mb-12" : "grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12"}>
          {availableScenarios.map((sc) => {
            const isSelected = selectedScenario.id === sc.id;
            const Icon = sc.icon;

            return (
              <button
                key={sc.id}
                onClick={() => setSelectedScenario(sc)}
                className={`p-5 rounded-2xl text-left border transition-all duration-300 flex flex-col justify-between cursor-pointer ${availableScenarios.length === 1 ? "w-full max-w-sm" : ""
                  } ${isSelected
                    ? t.cardSelected
                    : "bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-800/50"
                  }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${isSelected ? t.cardIconSelected : t.cardIconDefault
                  }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm mb-1 leading-snug">{sc.name}</h3>
                  <p className="text-[11px] opacity-75 line-clamp-2">{sc.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Scenario & Call Control Box */}
        <div className="max-w-3xl mx-auto bg-slate-950/80 border border-slate-800 rounded-3xl p-8 md:p-10 shadow-2xl backdrop-blur-xl relative z-20">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-800">
            <div className={`w-12 h-12 rounded-2xl ${t.boxIconContainer} flex items-center justify-center`}>
              <selectedScenario.icon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-white">{selectedScenario.name} Agent</h3>
              <p className="text-xs text-slate-400 italic">"{selectedScenario.greeting}"</p>
            </div>
          </div>

          {/* Live Demo Call Form (Required Fields: Name & Phone Number) */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Your Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  disabled={callingState === "calling"}
                  className={`w-full px-5 py-4 rounded-2xl bg-slate-900 border border-slate-700 text-white text-base font-medium placeholder:text-slate-500 outline-none ${t.inputFocus} transition-all`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Phone Number (E.164 Format) <span className="text-red-400">*</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  {/* Country Selector Dropdown with SVG Flags */}
                  <CountrySelectorDropdown
                    selectedCountry={selectedCountry}
                    onSelectCountry={setSelectedCountry}
                    disabled={callingState === "calling"}
                  />

                  {/* Phone Input Box */}
                  <div className="flex-1 relative">
                    <input
                      type="tel"
                      placeholder={selectedCountry.format}
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      disabled={callingState === "calling"}
                      className={`w-full px-5 py-4 rounded-2xl bg-slate-900 border border-slate-700 text-white text-base font-medium placeholder:text-slate-500 outline-none ${t.inputFocus} transition-all`}
                    />
                  </div>
                </div>

                {/* E.164 Live Format Preview Badge */}
                {phoneNumber.trim() && (
                  <div className="mt-2.5 flex items-center gap-2 text-xs">
                    <span className="text-slate-400 font-mono text-[11px]">E.164 Target:</span>
                    <span className={`font-mono text-xs font-bold px-2.5 py-0.5 rounded-md border ${
                      formatToE164(selectedCountry.dialCode, phoneNumber).isValid
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : "bg-rose-500/10 border-rose-500/30 text-rose-400"
                    }`}>
                      {formatToE164(selectedCountry.dialCode, phoneNumber).e164}
                    </span>
                    {!formatToE164(selectedCountry.dialCode, phoneNumber).isValid && (
                      <span className="text-rose-400/80 text-[11px]">(8-15 digits required)</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              {callingState === "calling" ? (
                <button
                  disabled
                  className={`w-full sm:w-auto px-8 py-4 bg-slate-800 ${t.dialingBtnText} rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shrink-0`}
                >
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Dialing...</span>
                </button>
              ) : hasTriggeredCall ? (
                <button
                  onClick={handleStartDemoClick}
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-xl shadow-emerald-600/30 hover:scale-[1.02]"
                >
                  <Phone className="w-4 h-4 fill-white" />
                  <span>Call Again</span>
                </button>
              ) : (
                <button
                  onClick={handleStartDemoClick}
                  className={`w-full sm:w-auto px-8 py-4 ${t.callBtn} text-white rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-lg hover:scale-[1.02]`}
                >
                  <Phone className="w-4 h-4 fill-white" />
                  <span>Call Me Now</span>
                </button>
              )}
            </div>

            {callStatusMessage && (
              <div className={`p-4 rounded-2xl ${t.statusBanner} text-xs font-semibold flex items-center gap-2`}>
                <CheckCircle2 className={`w-4 h-4 ${t.statusIcon} shrink-0`} />
                <span>{callStatusMessage}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <ToastNotification toast={toast} onClose={() => setToast(null)} />
    </section>
  );
}
