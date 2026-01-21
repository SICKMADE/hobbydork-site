import { getFunctions, httpsCallable } from "firebase/functions";
import { initializeApp, getApps, getApp } from "firebase/app";
import { firebaseConfig } from "@/firebase/config";

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const functions = getFunctions(app, "us-central1");
export const createBlindBidAuction = httpsCallable(functions, "createBlindBidAuction");
export const submitBlindBid = httpsCallable(functions, "submitBlindBid");
export const adminRerunBlindBidAuction = httpsCallable(functions, "adminRerunBlindBidAuction");
