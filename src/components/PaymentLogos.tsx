// Official Indian UPI & Payment App Logos

export function UpiLogo({ className = 'h-5 w-auto' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* UPI Arrows */}
      <path d="M23.5 6L8.5 20L23.5 34L28.5 29.5L18.5 20L28.5 10.5L23.5 6Z" fill="#097939" />
      <path d="M33.5 6L18.5 20L33.5 34L38.5 29.5L28.5 20L38.5 10.5L33.5 6Z" fill="#ED7524" />
      {/* UPI Text */}
      <path
        d="M51 9V24C51 27.5 48.5 30 44.5 30C40.5 30 38 27.5 38 24V9H43V24C43 25.5 43.8 26.5 44.5 26.5C45.2 26.5 46 25.5 46 24V9H51Z"
        fill="#062A61"
      />
      <path
        d="M55 9H64C68 9 70.5 11.2 70.5 14.8C70.5 18.5 68 20.8 64 20.8H60V30H55V9ZM60 13V16.8H63.8C65 16.8 65.5 16 65.5 14.9C65.5 13.8 65 13 63.8 13H60Z"
        fill="#062A61"
      />
      <path d="M74 9H79V30H74V9Z" fill="#062A61" />
      <path d="M85 30L90.5 9H95.5L101 30H96L95 25.5H91L90 30H85ZM91.8 21.8H94.2L93 15.5L91.8 21.8Z" fill="#ED7524" />
    </svg>
  );
}

// PhonePe Circle Logo
export function PhonePeCircle({ className = 'w-10 h-10' }: { className?: string }) {
  return (
    <div className={`relative shrink-0 rounded-full flex items-center justify-center shadow-sm overflow-hidden bg-[#5F259F] ${className}`}>
      <svg viewBox="0 0 40 40" className="w-[68%] h-[68%]" fill="none">
        <path
          d="M23.5 11.5H19.2C18.8 11.5 18.5 11.8 18.5 12.2V14.5H16.2C15.8 14.5 15.5 14.8 15.5 15.2V17.2C15.5 17.6 15.8 17.9 16.2 17.9H18.5V20.2C18.5 23.5 20.5 25.5 24 25.5H26.2C26.6 25.5 26.9 25.2 26.9 24.8V22.8C26.9 22.4 26.6 22.1 26.2 22.1H24.2C22.6 22.1 21.8 21.3 21.8 19.6V17.9H26C26.4 17.9 26.7 17.6 26.7 17.2V15.2C26.7 14.8 26.4 14.5 26 14.5H21.8V12.2C21.8 11.8 22.1 11.5 22.5 11.5H23.5C23.9 11.5 24.2 11.2 24.2 10.8V9.2C24.2 8.8 23.9 8.5 23.5 8.5H19.5C17.2 8.5 15.5 10.2 15.5 12.5V14.5H13.5C13.1 14.5 12.8 14.8 12.8 15.2V17.2C12.8 17.6 13.1 17.9 13.5 17.9H15.5V27.5C15.5 27.9 15.8 28.2 16.2 28.2H18.5C18.9 28.2 19.2 27.9 19.2 27.5V25.5H23.2C27.5 25.5 30.2 23 30.2 18.5V12.5C30.2 10.2 28.5 8.5 26.2 8.5L23.5 11.5Z"
          fill="white"
        />
        {/* 'पे' lettermark accurate path */}
        <path
          d="M21 9H16.5C14 9 12 11 12 13.5V15.5H10.5C10 15.5 9.5 16 9.5 16.5V18.5C9.5 19 10 19.5 10.5 19.5H12V29C12 29.6 12.4 30 13 30H15.5C16.1 30 16.5 29.6 16.5 29V25H21C25.5 25 28.5 22.5 28.5 18V13.5C28.5 11 26.5 9 24 9H21ZM24 19.5C24 21 22.8 22 21 22H16.5V14H24C24.8 14 25.5 14.7 25.5 15.5V18C25.5 18.8 24.8 19.5 24 19.5Z"
          fill="white"
        />
        {/* Accent dot */}
        <circle cx="21" cy="6.5" r="1.8" fill="white" />
      </svg>
    </div>
  );
}

// Google Pay Circle Logo
export function GPayCircle({ className = 'w-10 h-10' }: { className?: string }) {
  return (
    <div className={`relative shrink-0 rounded-full flex items-center justify-center bg-white border border-[#DCE8F8] shadow-sm overflow-hidden ${className}`}>
      <svg viewBox="0 0 40 40" className="w-[70%] h-[70%]" fill="none">
        {/* GPay Four-Color Ribbons */}
        <path
          d="M28.4 17.2C27.6 15.5 26.2 14.1 24.6 13.2L19.2 18.6C19.8 19 20.4 19.5 20.8 20.1L28.4 17.2Z"
          fill="#EA4335"
        />
        <path
          d="M19.2 18.6L13.8 13.2C12.1 14.2 10.8 15.8 10.2 17.6C9.6 19.4 9.7 21.4 10.5 23.1L16.2 21.2C16.1 20.2 16.5 19.3 17.2 18.6L19.2 18.6Z"
          fill="#4285F4"
        />
        <path
          d="M16.2 21.2L10.5 23.1C11.5 25.1 13.2 26.6 15.2 27.3L20 22C19.2 22 18.4 21.7 17.8 21.2L16.2 21.2Z"
          fill="#34A853"
        />
        <path
          d="M24.6 13.2C23.1 12.4 21.5 12 19.8 12C17.6 12 15.5 12.6 13.8 13.7L19.2 19.1L24.6 13.2Z"
          fill="#FBBC05"
        />
        <path
          d="M20 22L15.2 27.3C16.6 27.8 18.2 28 19.8 28C22.6 28 25.2 26.8 27 24.8L21.8 20.8C21.4 21.5 20.8 21.9 20 22Z"
          fill="#34A853"
        />
        <path
          d="M28.4 17.2L20.8 20.1C21.2 20.7 21.5 21.4 21.5 22.1C21.5 22.3 21.5 22.5 21.4 22.7L26.6 26.7C27.9 25.2 28.7 23.3 28.9 21.3C29.1 19.9 28.9 18.5 28.4 17.2Z"
          fill="#4285F4"
        />
      </svg>
    </div>
  );
}

// Paytm Circle Logo
export function PaytmCircle({ className = 'w-10 h-10' }: { className?: string }) {
  return (
    <div className={`relative shrink-0 rounded-full flex items-center justify-center bg-white border border-[#DCE8F8] shadow-sm overflow-hidden ${className}`}>
      <svg viewBox="0 0 50 50" className="w-[82%] h-[82%]" fill="none">
        {/* Paytm wordmark styled inside circle */}
        <text
          x="7"
          y="31"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="15"
          fill="#002970"
          letterSpacing="-0.5"
        >
          Pay
        </text>
        <text
          x="32"
          y="31"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="15"
          fill="#00BAF2"
          letterSpacing="-0.5"
        >
          tm
        </text>
      </svg>
    </div>
  );
}

// UPI Circle Logo
export function UpiCircle({ className = 'w-10 h-10' }: { className?: string }) {
  return (
    <div className={`relative shrink-0 rounded-full flex items-center justify-center bg-white border border-[#DCE8F8] shadow-sm overflow-hidden ${className}`}>
      <svg viewBox="0 0 40 40" className="w-[74%] h-[74%]" fill="none">
        {/* Dual Arrows */}
        <path d="M16 11L9 19L16 27L18.5 24.5L13.5 19L18.5 13.5L16 11Z" fill="#097939" />
        <path d="M22 11L15 19L22 27L24.5 24.5L19.5 19L24.5 13.5L22 11Z" fill="#ED7524" />
        {/* UPI text */}
        <text
          x="19"
          y="23"
          fontFamily="monospace, system-ui, sans-serif"
          fontWeight="900"
          fontSize="9"
          fill="#062A61"
          letterSpacing="0.5"
        >
          UPI
        </text>
      </svg>
    </div>
  );
}
