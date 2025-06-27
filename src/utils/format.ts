import { format as dateFnsFormat } from "date-fns";

export const formatDate = (date: string | Date) => {
  return dateFnsFormat(new Date(date), "PPP");
};

export const formatDateTime = (date: string | Date) => {
  return dateFnsFormat(new Date(date), "PPP p");
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
  }).format(amount);
};

export const formatNumber = (number: number) => {
  return new Intl.NumberFormat("en-EG").format(number);
}; 