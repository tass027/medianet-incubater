'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import ProtectedRoute from '@/app/components/common/ProtectedRoute';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import Badge from '@/app/components/common/Badge';
import Modal from '@/app/components/common/Modal';
import Alert from '@/app/components/common/Alert';
import { useSelector } from 'react-redux';
import Link from 'next/link';

// ===================================================
// CONSTANTS
// ===================================================
const APPLICATION_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  REVIEWING: 'reviewing',
  INTERVIEW: 'interview',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ACCEPTED: 'accepted',
};

const STATUS_CONFIG = {
  [APPLICATION_STATUS.DRAFT]: {
    label: 'Brouillon', variant: 'gray', color: '#64748b',
    bg: 'bg-slate-50 dark:bg-slate-900', border: 'border-slate-200 dark:border-slate-700',
    gradient: 'from-slate-400 to-slate-500'
  },
  [APPLICATION_STATUS.SUBMITTED]: {
    label: 'Soumise', variant: 'info', color: '#3b82f6',
    bg: 'bg-blue-50 dark:bg-blue-950', border: 'border-blue-200 dark:border-blue-800',
    gradient: 'from-blue-500 to-blue-600'
  },
  [APPLICATION_STATUS.REVIEWING]: {
    label: "En cours d'évaluation", variant: 'warning', color: '#f59e0b',
    bg: 'bg-amber-50 dark:bg-amber-950', border: 'border-amber-200 dark:border-amber-800',
    gradient: 'from-amber-500 to-orange-500'
  },
  [APPLICATION_STATUS.INTERVIEW]: {
    label: 'Entretien programmé', variant: 'accent', color: '#8b5cf6',
    bg: 'bg-purple-50 dark:bg-purple-950', border: 'border-purple-200 dark:border-purple-800',
    gradient: 'from-purple-500 to-pink-500'
  },
  [APPLICATION_STATUS.APPROVED]: {
    label: 'Approuvée', variant: 'success', color: '#10b981',
    bg: 'bg-emerald-50 dark:bg-emerald-950', border: 'border-emerald-200 dark:border-emerald-800',
    gradient: 'from-emerald-500 to-teal-500'
  },
  [APPLICATION_STATUS.REJECTED]: {
    label: 'Non retenue', variant: 'error', color: '#ef4444',
    bg: 'bg-red-50 dark:bg-red-950', border: 'border-red-200 dark:border-red-800',
    gradient: 'from-red-500 to-rose-500'
  },
  [APPLICATION_STATUS.ACCEPTED]: {
    label: 'Acceptée', variant: 'success', color: '#10b981',
    bg: 'bg-emerald-50 dark:bg-emerald-950', border: 'border-emerald-200 dark:border-emerald-800',
    gradient: 'from-emerald-500 to-teal-500'
  },
};

const TIMELINE_STEPS = [
  { key: 'submitted', label: 'Candidature soumise', description: 'Dossier complet reçu', milestone: true },
  { key: 'reviewing', label: 'Évaluation', description: 'Analyse par notre comité', milestone: true },
  { key: 'interview', label: 'Entretien', description: "Échange avec l'équipe", milestone: true },
  { key: 'decision', label: 'Décision finale', description: 'Validation du programme', milestone: true },
];

// ===================================================
// ICONS COMPONENTS
// ===================================================
const Icons = {
  Document: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  Download: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),
  Calendar: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Time: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Check: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  Warning: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  Mail: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  Phone: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
  ArrowRight: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
    </svg>
  ),
  Chat: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  Chart: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  Star: ({ className }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  ),
  TrendingUp: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  External: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  ),
  Refresh: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  Bell: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  Copy: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="9" y="9" width="13" height="13" rx="2" strokeWidth={1.5} />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeWidth={1.5} />
    </svg>
  ),
  Eye: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  Send: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  ),
  Search: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  Mic: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  ),
  Scale: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l9-4 9 4M3 6v12l9 4m0-16v16m0 0l9-4V6" />
    </svg>
  ),
  FileText: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  PresentationChart: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
    </svg>
  ),
  TableCells: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  Bolt: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  Note: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  Info: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Timeline: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
  Linkedin: ({ className }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451c.979 0 1.771-.773 1.771-1.729V1.729C24 .774 23.204 0 22.225 0z" />
    </svg>
  ),
};

// Timeline step icons
const TimelineIcons = {
  submitted: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  reviewing: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  interview: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  ),
  decision: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l9-4 9 4M3 6v12l9 4m0-16v16m0 0l9-4V6" />
    </svg>
  ),
};

// ===================================================
// ANIMATED NUMBER COMPONENT
// ===================================================
const AnimatedNumber = ({ value, duration = 1000 }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const end = value;
          const increment = end / (duration / 16);
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= end) {
              setDisplayValue(end);
              clearInterval(timer);
            } else {
              setDisplayValue(Math.floor(current));
            }
          }, 16);
          return () => clearInterval(timer);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, duration, hasAnimated]);

  return <span ref={ref}>{displayValue}</span>;
};

// ===================================================
// PROGRESS RING COMPONENT
// ===================================================
const ProgressRing = ({ progress, size = 120, strokeWidth = 8 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  const [isVisible, setIsVisible] = useState(false);
  const ringRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) { setIsVisible(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    if (ringRef.current) observer.observe(ringRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ringRef} className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} className="dark:stroke-gray-700" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="url(#ring-gradient)" strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={isVisible ? offset : circumference}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
        />
        <defs>
          <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00526e" />
            <stop offset="50%" stopColor="#006d94" />
            <stop offset="100%" stopColor="#0088ba" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-gray-900 dark:text-white">{progress}%</span>
      </div>
    </div>
  );
};

// ===================================================
// TIMELINE NODE COMPONENT
// ===================================================
const TimelineNode = ({ step, isCompleted, isCurrent, date, expectedDate, notes, index, total }) => {
  const [isVisible, setIsVisible] = useState(false);
  const nodeRef = useRef(null);
  const StepIcon = TimelineIcons[step.key] || Icons.Check;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) { setIsVisible(true); observer.disconnect(); } },
      { threshold: 0.5 }
    );
    if (nodeRef.current) observer.observe(nodeRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={nodeRef}
      className="relative flex gap-4"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateX(0)' : 'translateX(-20px)',
        transition: 'all 0.5s ease-out',
        transitionDelay: `${index * 0.1}s`
      }}
    >
      <div className="relative">
        <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
          isCompleted ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' :
          isCurrent ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 animate-pulse' :
          'bg-gray-200 dark:bg-gray-700 text-gray-400'
        }`}>
          {isCompleted ? (
            <Icons.Check className="w-6 h-6" />
          ) : (
            <StepIcon className="w-5 h-5" />
          )}
        </div>
        {index < total - 1 && (
          <div className={`absolute top-12 left-1/2 w-0.5 h-16 -translate-x-1/2 ${isCompleted ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
        )}
      </div>
      <div className="flex-1 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className={`font-semibold text-lg ${isCompleted || isCurrent ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
            {step.label}
          </p>
          {date && <span className="text-xs text-gray-400 font-mono">{date}</span>}
          {expectedDate && !date && (
            <span className="text-xs text-amber-600 dark:text-amber-400 animate-pulse">Prévision: {expectedDate}</span>
          )}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{step.description}</p>
        {notes && (
          <p className="text-xs text-gray-400 mt-2 italic flex items-center gap-1.5">
            <Icons.Note className="w-3 h-3 flex-shrink-0" />
            {notes}
          </p>
        )}
        {isCurrent && (
          <div className="mt-2">
            <Badge variant="warning" size="sm" className="animate-pulse">En cours d'évaluation</Badge>
          </div>
        )}
      </div>
    </div>
  );
};

// ===================================================
// STATS CARD COMPONENT
// ===================================================
const StatsCard = ({ icon: Icon, label, value, subValue, trend, color, delay }) => {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) { setIsVisible(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={cardRef}
      className="glass-card rounded-xl p-5 hover-scale dark:!bg-[#1e293b] group transition-all duration-300 hover:-translate-y-1"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.5s ease-out',
        transitionDelay: `${delay}s`
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg bg-${color}-100 dark:bg-${color}-900/30 flex items-center justify-center group-hover:scale-110 transition-transform`}>
          <Icon className={`w-5 h-5 text-${color}-600 dark:text-${color}-400`} />
        </div>
        {trend && (
          <span className={`text-xs font-medium ${trend > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
      <p className="text-xl font-bold text-gray-900 dark:text-white">
        {typeof value === 'number' ? <AnimatedNumber value={value} /> : value}
      </p>
      {subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}
    </div>
  );
};

// ===================================================
// MAIN PAGE
// ===================================================
export default function ApplicantStatusPage() {
  const { user } = useSelector((state) => state.auth);
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState(new Date());
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [alert, setAlert] = useState(null);
  const [activeTab, setActiveTab] = useState('timeline');
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setTime(new Date()), 1000);

    setTimeout(() => {
      setApplication({
        id: 1,
        startupName: 'PayTunis',
        sector: 'FinTech',
        amount: '500,000 TND',
        stage: 'Seed',
        status: APPLICATION_STATUS.REVIEWING,
        submittedAt: '2026-03-20T10:30:00',
        lastUpdated: '2026-03-24T14:30:00',
        progress: 65,
        estimatedDecision: '2026-04-15',
        documents: [
          { id: 1, name: 'Business Plan', size: '2.4 MB', uploadedAt: '2026-03-20', status: 'approved', type: 'pdf' },
          { id: 2, name: 'Pitch Deck', size: '3.1 MB', uploadedAt: '2026-03-20', status: 'approved', type: 'pptx' },
          { id: 3, name: 'Financial Projections', size: '1.2 MB', uploadedAt: '2026-03-21', status: 'pending', type: 'xlsx' },
          { id: 4, name: 'Team CVs', size: '0.8 MB', uploadedAt: '2026-03-20', status: 'approved', type: 'pdf' },
        ],
        timeline: [
          { step: 'submitted', date: '2026-03-20T10:30:00', completed: true, notes: 'Candidature reçue avec succès' },
          { step: 'reviewing', date: '2026-03-22T09:00:00', completed: true, notes: 'Évaluation en cours par le comité' },
          { step: 'interview', date: null, completed: false, expectedDate: '2026-04-05', notes: 'En attente de confirmation de planning' },
          { step: 'decision', date: null, completed: false, expectedDate: '2026-04-15', notes: null },
        ],
        feedback: {
          strengths: [
            'Équipe solide avec une expérience pertinente dans le secteur FinTech',
            'Innovation prometteuse avec un avantage concurrentiel unique',
            'Marché en forte croissance avec un potentiel de scaling important',
            'Modèle économique viable avec des marges intéressantes'
          ],
          improvements: [
            'Prévisions financières à affiner sur les 3 prochaines années',
            'Traction à démontrer avec plus de clients et de revenus récurrents',
            'Stratégie marketing à détailler pour l\'acquisition clients',
            'Plan de développement produit à préciser'
          ],
          score: 83,
          evaluator: 'Mohamed Jerbi',
          evaluatorTitle: 'Head of Program',
          evaluatorAvatar: 'MJ',
          evaluatedAt: '2026-03-24',
          comments: "Projet très prometteur, avec une équipe motivée et une solution innovante. Quelques points à clarifier sur le modèle économique et la stratégie de go-to-market, mais dans l'ensemble, une candidature de grande qualité qui mérite d'être poussée en entretien.",
          categories: [
            { name: 'Équipe', score: 85, maxScore: 100 },
            { name: 'Innovation', score: 90, maxScore: 100 },
            { name: 'Marché', score: 80, maxScore: 100 },
            { name: 'Business Model', score: 75, maxScore: 100 },
            { name: 'Traction', score: 85, maxScore: 100 },
          ]
        },
        nextActions: [
          { title: "Préparer l'entretien", description: "Consultez le guide d'entretien et préparez vos réponses", deadline: '2026-04-04', urgent: true, link: '/resources/interview-guide', completed: false },
          { title: 'Compléter les projections', description: 'Ajoutez des détails sur les 3 prochaines années', deadline: '2026-03-30', urgent: true, link: null, completed: false },
          { title: 'Mettre à jour le pitch deck', description: 'Ajoutez les derniers KPIs et métriques', deadline: null, urgent: false, link: null, completed: false },
        ],
        contact: {
          name: 'Karim Ben Ali',
          role: 'Responsable Programme Incubation',
          email: 'karim.benali@medianet.tn',
          phone: '+216 71 123 456',
          avatar: 'KB',
          availability: 'Lun-Ven, 9h-18h',
          responseTime: '< 24h',
          linkedin: 'https://linkedin.com/in/karim-benali'
        },
        stats: {
          views: 47,
          lastView: '2026-03-25T10:30:00',
          averageScore: 83,
          rank: 12,
          totalApplicants: 156,
          percentile: 92
        },
        shareableLink: 'https://medianet.tn/applications/1/share-token-abc123'
      });

      setTimeout(() => {
        setNotifications([
          { id: 1, message: "Votre dossier a été consulté par l'équipe d'évaluation", type: 'info', time: 'Il y a 2 minutes', read: false },
          { id: 2, message: 'Nouveau commentaire sur votre candidature', type: 'success', time: 'Il y a 1 heure', read: true },
        ]);
      }, 1500);

      setLoading(false);
    }, 800);

    return () => clearInterval(timer);
  }, []);

  const statusConfig = STATUS_CONFIG[application?.status] || STATUS_CONFIG[APPLICATION_STATUS.SUBMITTED];

  const getDaysRemaining = (dateStr) => {
    if (!dateStr) return null;
    const target = new Date(dateStr);
    const today = new Date();
    const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'Dépassé';
    if (diff === 0) return "Aujourd'hui";
    return `${diff} jours restants`;
  };

  const formatDate = (dateStr, withTime = false) => {
    if (!dateStr) return 'En attente';
    const date = new Date(dateStr);
    if (withTime) {
      return date.toLocaleString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setAlert({ type: 'success', message: 'Données actualisées avec succès' });
      setTimeout(() => setAlert(null), 3000);
    }, 1000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(application?.shareableLink);
    setAlert({ type: 'success', message: 'Lien copié dans le presse-papier' });
    setTimeout(() => setAlert(null), 3000);
    setShowShareModal(false);
  };

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Document type icon helper
  const getDocIcon = (type) => {
    if (type === 'pdf') return Icons.FileText;
    if (type === 'pptx') return Icons.PresentationChart;
    return Icons.TableCells;
  };

  const getDocIconColors = (type) => {
    if (type === 'pdf') return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
    if (type === 'pptx') return 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400';
    return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
  };

  // Status icon helper
  const getStatusIcon = () => {
    switch (application?.status) {
      case APPLICATION_STATUS.DRAFT: return Icons.FileText;
      case APPLICATION_STATUS.SUBMITTED: return Icons.Send;
      case APPLICATION_STATUS.REVIEWING: return Icons.Search;
      case APPLICATION_STATUS.INTERVIEW: return Icons.Mic;
      case APPLICATION_STATUS.APPROVED:
      case APPLICATION_STATUS.ACCEPTED: return Icons.Check;
      case APPLICATION_STATUS.REJECTED: return Icons.Warning;
      default: return Icons.Send;
    }
  };
  const StatusIcon = getStatusIcon();

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['applicant']}>
        <DashboardLayout>
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-primary-200 dark:border-primary-800"></div>
                <div className="absolute inset-0 rounded-full border-4 border-primary-600 border-t-transparent animate-spin"></div>
              </div>
              <p className="mt-4 text-gray-600 dark:text-gray-400 animate-pulse">Chargement de votre dossier...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const TABS = [
    { id: 'timeline', label: 'Timeline', Icon: Icons.Timeline, count: null },
    { id: 'documents', label: 'Documents', Icon: Icons.Document, count: application?.documents?.length },
    { id: 'feedback', label: 'Évaluation', Icon: Icons.Star, count: null },
    { id: 'actions', label: 'Actions', Icon: Icons.Bolt, count: application?.nextActions?.filter(a => !a.completed).length },
  ];

  return (
    <ProtectedRoute allowedRoles={['applicant']}>
      <DashboardLayout>
        <style jsx>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
          * { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }

          @keyframes slideInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }

          .animate-slide-in-up { animation: slideInUp 0.5s ease-out forwards; }
          .float { animation: float 6s ease-in-out infinite; }

          .glass-card {
            background: rgba(255,255,255,0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(0,0,0,0.05);
            transition: all 0.3s ease;
          }
          :global(.dark) .glass-card {
            background: #1e293b;
            border: 1px solid #334155;
          }
          .glass-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 20px 25px -12px rgba(0,0,0,0.15);
          }
          .dark-glass {
            background: linear-gradient(135deg, rgba(0,82,110,0.95), rgba(0,109,148,0.95));
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.1);
          }
          .hover-scale { transition: transform 0.2s ease; }
          .hover-scale:hover { transform: translateY(-2px); }

          :global(.dark) .text-gray-900 { color: #f1f5f9; }
          :global(.dark) .text-gray-700 { color: #cbd5e1; }
          :global(.dark) .text-gray-600 { color: #94a3b8; }
          :global(.dark) .bg-gray-50 { background-color: #0f172a; }
          :global(.dark) .bg-white { background-color: #1e293b; }
          :global(.dark) .border-gray-100 { border-color: #334155; }
        `}</style>

        <div className="space-y-6 min-h-screen pb-10">

          {/* ── HEADER ──────────────────────────────────────────────────── */}
          <div
            className="relative overflow-hidden rounded-2xl p-8 animate-slide-in-up"
            style={{ background: 'linear-gradient(135deg,#00526e 0%,#006d94 50%,#0088ba 100%)' }}
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-48 -mt-48 float"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full -ml-32 -mb-32 float" style={{ animationDelay: '2s' }}></div>

            <div className="relative flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-white/90 tracking-wide backdrop-blur-sm">
                    SUIVI DE CANDIDATURE
                  </div>
                  <div className="w-1 h-1 bg-white/30 rounded-full"></div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-white/80">Mise à jour en temps réel</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2 tracking-tight">
                    {application?.startupName}
                  </h1>
                  <Badge variant={statusConfig.variant} size="lg">
                    {statusConfig.label}
                  </Badge>
                </div>
                <p className="text-blue-100 text-base lg:text-lg max-w-2xl">
                  {application?.sector} • {application?.stage} • {application?.amount}
                </p>
                <div className="flex items-center gap-4 text-blue-100 mt-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Icons.Time className="w-4 h-4 text-blue-200" />
                    <span className="font-mono text-sm">
                      {mounted && time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <div className="w-px h-3 bg-blue-400/30"></div>
                  <span className="text-sm">
                    Dernière mise à jour: {formatDate(application?.lastUpdated, true)}
                  </span>
                </div>
              </div>

              {/* Actions Bar */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefresh}
                  className="relative p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all"
                  title="Actualiser"
                >
                  <Icons.Refresh className={`w-5 h-5 text-white ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>

                <button
                  onClick={() => setShowShareModal(true)}
                  className="relative p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all"
                  title="Partager"
                >
                  <Icons.Copy className="w-5 h-5 text-white" />
                </button>

                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all"
                    title="Notifications"
                  >
                    <Icons.Bell className="w-5 h-5 text-white" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && notifications.length > 0 && (
                    <div className="absolute right-0 mt-2 w-80 glass-card rounded-xl shadow-2xl overflow-hidden z-50">
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                        <span className="font-semibold text-gray-900 dark:text-white">Notifications</span>
                        <button onClick={handleMarkAllRead} className="text-xs text-primary-600 hover:underline">Tout marquer comme lu</button>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.map(notif => (
                          <div
                            key={notif.id}
                            className={`px-4 py-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${!notif.read ? 'bg-primary-50 dark:bg-primary-900/10' : ''}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!notif.read ? 'bg-primary-500' : 'bg-gray-300'}`} />
                              <div className="flex-1">
                                <p className="text-sm text-gray-700 dark:text-gray-300">{notif.message}</p>
                                <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="dark-glass rounded-xl p-3 min-w-[200px] backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg"
                        style={{ background: statusConfig.color }}
                      >
                        <StatusIcon className="w-5 h-5" />
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white dark:border-gray-800 rounded-full"></div>
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{statusConfig.label}</p>
                      <p className="text-blue-200 text-[10px] font-mono tracking-wider">STATUT ACTUEL</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── STATS CARDS ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard icon={Icons.Calendar} label="Date de soumission" value={formatDate(application?.submittedAt)} subValue={`Il y a ${Math.floor((Date.now() - new Date(application?.submittedAt)) / (1000 * 60 * 60 * 24))} jours`} color="blue" delay={0.1} />
            <StatsCard icon={Icons.Check} label="Progression" value={`${application?.progress}%`} subValue="Objectif: 100%" color="emerald" delay={0.2} />
            <StatsCard icon={Icons.Warning} label="Décision estimée" value={formatDate(application?.estimatedDecision)} subValue={getDaysRemaining(application?.estimatedDecision)} color="amber" delay={0.3} />
            <StatsCard icon={Icons.Document} label="Documents validés" value={`${application?.documents?.filter(d => d.status === 'approved').length}/${application?.documents?.length}`} subValue="Tous les documents requis" color="purple" delay={0.4} />
          </div>

          {/* ── PROGRESS RING & QUICK STATS ────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="glass-card rounded-xl p-6 flex flex-col items-center justify-center">
              <ProgressRing progress={application?.progress} size={140} strokeWidth={10} />
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">Progression globale</p>
                <p className="text-xs text-gray-400 mt-1">{application?.progress}% complété</p>
              </div>
            </div>
            <div className="lg:col-span-2 grid grid-cols-2 gap-4">
              <StatsCard icon={Icons.Chart} label="Classement" value={`#${application?.stats?.rank}`} subValue={`sur ${application?.stats?.totalApplicants} candidats`} color="indigo" delay={0.5} />
              <StatsCard icon={Icons.Star} label="Score moyen" value={`${application?.stats?.averageScore}/100`} subValue={`Top ${application?.stats?.percentile}% des candidats`} color="amber" delay={0.6} />
              <StatsCard icon={Icons.Eye} label="Vues du dossier" value={application?.stats?.views} subValue={`Dernière vue: ${formatDate(application?.stats?.lastView, true)}`} color="cyan" delay={0.7} />
              <StatsCard icon={Icons.TrendingUp} label="Taux de progression" value="+23%" subValue="vs. semaine dernière" color="emerald" delay={0.8} />
            </div>
          </div>

          {/* ── TABS ────────────────────────────────────────────────────── */}
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="border-b border-gray-100 dark:border-gray-800">
              <div className="flex gap-1 px-4 overflow-x-auto">
                {TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-3 px-4 text-sm font-medium transition-all border-b-2 flex items-center gap-2 flex-shrink-0 ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <tab.Icon className="w-4 h-4" />
                    {tab.label}
                    {tab.count !== null && tab.count > 0 && (
                      <span className={`px-1.5 py-0.5 text-xs rounded-full ${activeTab === tab.id ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6">

              {/* Timeline Tab */}
              {activeTab === 'timeline' && (
                <div className="relative">
                  <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
                  <div className="space-y-6">
                    {TIMELINE_STEPS.map((step, idx) => {
                      const stepData = application?.timeline?.find(s => s.step === step.key);
                      const isCompleted = stepData?.completed;
                      const isCurrent = step.key === 'interview' && !stepData?.completed && application?.timeline?.find(s => s.step === 'reviewing')?.completed;
                      const stepDate = stepData?.date ? formatDate(stepData.date, true) : null;
                      const expectedDate = stepData?.expectedDate ? formatDate(stepData.expectedDate) : null;

                      return (
                        <TimelineNode
                          key={step.key}
                          step={step}
                          isCompleted={isCompleted}
                          isCurrent={isCurrent}
                          date={stepDate}
                          expectedDate={expectedDate}
                          notes={stepData?.notes}
                          index={idx}
                          total={TIMELINE_STEPS.length}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Documents Tab */}
              {activeTab === 'documents' && (
                <div className="space-y-3">
                  {application?.documents?.map((doc, idx) => {
                    const DocIcon = getDocIcon(doc.type);
                    return (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all group"
                        style={{ animationDelay: `${idx * 0.05}s` }}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform ${getDocIconColors(doc.type)}`}>
                            <DocIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{doc.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{doc.size} • {formatDate(doc.uploadedAt)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={doc.status === 'approved' ? 'success' : 'warning'} size="sm">
                            {doc.status === 'approved' ? 'Validé' : 'En attente'}
                          </Badge>
                          <button className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">
                            <Icons.Download className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  <button className="w-full mt-4 py-3 text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl hover:border-primary-300 transition-all">
                    <Icons.Download className="w-4 h-4" />
                    Télécharger tous les documents
                  </button>
                </div>
              )}

              {/* Feedback Tab */}
              {activeTab === 'feedback' && application?.feedback && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Score total</p>
                      <p className="text-4xl font-bold text-amber-600 dark:text-amber-400">{application.feedback.score}<span className="text-lg">/100</span></p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold">
                          {application.feedback.evaluatorAvatar}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{application.feedback.evaluator}</p>
                          <p className="text-xs text-gray-500">{application.feedback.evaluatorTitle}</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(application.feedback.evaluatedAt)}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Détail des scores</h4>
                    <div className="space-y-3">
                      {application.feedback.categories.map((cat) => (
                        <div key={cat.name}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600 dark:text-gray-400">{cat.name}</span>
                            <span className="font-medium text-gray-900 dark:text-white">{cat.score}/{cat.maxScore}</span>
                          </div>
                          <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-800"
                              style={{ width: `${(cat.score / cat.maxScore) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-3 flex items-center gap-2">
                      <Icons.Check className="w-4 h-4" /> Points forts
                    </h4>
                    <div className="space-y-2">
                      {application.feedback.strengths.map((s, i) => (
                        <div key={i} className="flex items-start gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-100 dark:border-emerald-800">
                          <Icons.Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-2">
                      <Icons.Warning className="w-4 h-4" /> Axes d'amélioration
                    </h4>
                    <div className="space-y-2">
                      {application.feedback.improvements.map((s, i) => (
                        <div key={i} className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-100 dark:border-amber-800">
                          <Icons.Warning className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {application.feedback.comments && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-l-4 border-primary-500">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Commentaire de l'évaluateur</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 italic">"{application.feedback.comments}"</p>
                    </div>
                  )}

                  <button
                    onClick={() => setShowFeedbackModal(true)}
                    className="w-full py-3 text-center text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg hover:shadow-lg transition-all"
                  >
                    Voir l'évaluation complète
                  </button>
                </div>
              )}

              {/* Actions Tab */}
              {activeTab === 'actions' && (
                <div className="space-y-3">
                  {application?.nextActions?.map((action, i) => (
                    <div
                      key={i}
                      className={`p-4 rounded-xl border-2 transition-all ${action.urgent ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : action.completed ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {action.completed ? (
                              <Icons.Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                            ) : action.urgent ? (
                              <Icons.Warning className="w-5 h-5 text-red-500 animate-pulse flex-shrink-0" />
                            ) : (
                              <Icons.ArrowRight className="w-5 h-5 text-blue-500 flex-shrink-0" />
                            )}
                            <p className={`font-semibold ${action.completed ? 'text-gray-500 line-through' : 'text-gray-900 dark:text-white'}`}>
                              {action.title}
                            </p>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 ml-7">{action.description}</p>
                          {action.deadline && !action.completed && (
                            <p className={`text-xs mt-2 ml-7 flex items-center gap-1.5 ${getDaysRemaining(action.deadline) === 'Dépassé' ? 'text-red-600' : 'text-amber-600'}`}>
                              <Icons.Calendar className="w-3 h-3 flex-shrink-0" />
                              À faire avant le {formatDate(action.deadline)} • {getDaysRemaining(action.deadline)}
                            </p>
                          )}
                        </div>
                        {action.urgent && !action.completed && <Badge variant="error" size="sm">URGENT</Badge>}
                        {action.completed && <Badge variant="success" size="sm">Terminé</Badge>}
                      </div>
                      {action.link && !action.completed && (
                        <Link href={action.link} className="mt-3 ml-7 inline-flex items-center text-sm text-primary-600 hover:underline gap-1">
                          Voir le guide <Icons.External className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  ))}
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Icons.Info className="w-4 h-4 flex-shrink-0 text-gray-400" />
                    Les actions sont mises à jour automatiquement en fonction de l'avancement de votre dossier.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── CONTACT SECTION ────────────────────────────────────────── */}
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-semibold text-gray-900 dark:text-white">Votre contact dédié</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Une question ? N'hésitez pas</p>
            </div>
            <div className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    {application?.contact?.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-lg">{application?.contact?.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{application?.contact?.role}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Icons.Time className="w-3 h-3" /> {application?.contact?.availability}
                      </span>
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Icons.Check className="w-3 h-3" /> Réponse {application?.contact?.responseTime}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <a href={`mailto:${application?.contact?.email}`} className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors group">
                    <Icons.Mail className="w-4 h-4 text-gray-500 group-hover:text-primary-500 transition-colors" />
                    <span className="text-sm">Email</span>
                  </a>
                  <a href={`tel:${application?.contact?.phone}`} className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors group">
                    <Icons.Phone className="w-4 h-4 text-gray-500 group-hover:text-primary-500 transition-colors" />
                    <span className="text-sm">Appeler</span>
                  </a>
                  <a href={application?.contact?.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors group">
                    <Icons.Linkedin className="w-4 h-4 text-gray-500 group-hover:text-primary-500 transition-colors" />
                    <span className="text-sm">LinkedIn</span>
                  </a>
                  <button
                    onClick={() => setShowContactModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:shadow-lg transition-all"
                  >
                    <Icons.Chat className="w-4 h-4" />
                    <span className="text-sm">Envoyer un message</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── FOOTER SUPPORT ─────────────────────────────────────────── */}
          <div className="relative overflow-hidden rounded-xl p-6 bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-950 dark:to-gray-900">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
            <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center animate-pulse">
                  <Icons.Bolt className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Centre d'aide et ressources</h3>
                  <p className="text-white/60 text-sm">Consultez notre FAQ, guides et documentation</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-white font-bold text-xl font-mono">24/7</p>
                  <p className="text-white/60 text-xs">Support disponible</p>
                </div>
                <div className="w-px h-8 bg-white/20"></div>
                <div className="text-center">
                  <p className="text-white font-bold text-xl font-mono">~48h</p>
                  <p className="text-white/60 text-xs">Délai de réponse</p>
                </div>
                <div className="w-px h-8 bg-white/20"></div>
                <Link href="/faq" className="px-4 py-2 bg-white/10 rounded-lg text-white text-sm hover:bg-white/20 transition flex items-center gap-2">
                  FAQ <Icons.External className="w-3 h-3" />
                </Link>
                <Link href="/guides" className="px-4 py-2 bg-white/10 rounded-lg text-white text-sm hover:bg-white/20 transition flex items-center gap-2">
                  Guides <Icons.ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── FEEDBACK MODAL ──────────────────────────────────────────── */}
        {application?.feedback && (
          <Modal isOpen={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} title="Évaluation détaillée" size="lg">
            <div className="space-y-5">
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Score total</p>
                  <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{application.feedback.score}/100</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Évalué par</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{application.feedback.evaluator}</p>
                  <p className="text-xs text-gray-500">{formatDate(application.feedback.evaluatedAt)}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-2">
                  <Icons.Check className="w-4 h-4" /> Points forts
                </h4>
                <ul className="space-y-1.5">
                  {application.feedback.strengths.map((s, i) => (
                    <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                      <Icons.Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-2">
                  <Icons.Warning className="w-4 h-4" /> Axes d'amélioration
                </h4>
                <ul className="space-y-1.5">
                  {application.feedback.improvements.map((s, i) => (
                    <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                      <Icons.Warning className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              {application.feedback.comments && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-l-4 border-primary-500">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Commentaire</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 italic">"{application.feedback.comments}"</p>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  onClick={() => setShowFeedbackModal(false)}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition"
                >
                  Fermer
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* ── CONTACT MODAL ───────────────────────────────────────────── */}
        <Modal isOpen={showContactModal} onClose={() => setShowContactModal(false)} title="Envoyer un message" size="md">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Destinataire</label>
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-sm">
                  {application?.contact?.avatar}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{application?.contact?.name}</p>
                  <p className="text-xs text-gray-500">{application?.contact?.role}</p>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Objet</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all dark:bg-gray-800"
                placeholder="Objet de votre message"
                defaultValue="Question sur ma candidature"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Message</label>
              <textarea
                rows={5}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all dark:bg-gray-800"
                placeholder="Écrivez votre message ici..."
                defaultValue={`Bonjour ${application?.contact?.name},\n\nJe souhaiterais obtenir plus d'informations sur l'avancement de ma candidature pour le programme MEDIANET.\n\nMerci d'avance pour votre retour.\n\nCordialement,\n${user?.name}`}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setShowContactModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  setAlert({ type: 'success', message: 'Message envoyé avec succès' });
                  setShowContactModal(false);
                  setTimeout(() => setAlert(null), 3000);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg hover:shadow-lg transition"
              >
                Envoyer
              </button>
            </div>
          </div>
        </Modal>

        {/* ── SHARE MODAL ─────────────────────────────────────────────── */}
        <Modal isOpen={showShareModal} onClose={() => setShowShareModal(false)} title="Partager votre candidature" size="md">
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Partagez ce lien avec votre équipe ou vos mentors pour suivre l'avancement de votre candidature.
            </p>
            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <input
                type="text"
                value={application?.shareableLink}
                readOnly
                className="flex-1 bg-transparent text-sm text-gray-600 dark:text-gray-400 outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition"
              >
                Copier
              </button>
            </div>
          </div>
        </Modal>

        {/* ── ALERT ───────────────────────────────────────────────────── */}
        {alert && (
          <div className="fixed bottom-6 right-6 z-50 animate-slide-in-up">
            <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}