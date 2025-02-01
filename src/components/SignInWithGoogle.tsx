"use client";

import { useAuth } from '../lib/hooks/useAuth';
import Image from 'next/image';

export default function SignInWithGoogle() {
  const { signInWithGoogle } = useAuth();

  return (
    <button
      onClick={signInWithGoogle}
      className="flex items-center gap-3 px-6 py-3 bg-white text-gray-900 rounded-xl hover:bg-gray-50 transition-colors border border-gray-200 font-medium"
    >
      <Image
        src="/google.svg"
        alt="Google Logo"
        width={20}
        height={20}
        className="w-5 h-5"
      />
      Sign in with Google
    </button>
  );
}
