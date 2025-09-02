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

// Custom date formatting for orders (dd/mm/yy format)
export const formatOrderDate = (dateString: string | Date): string => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString().slice(-2); // Get last 2 digits of year
  return `${day}/${month}/${year}`;
};

export const formatOrderDateWithTime = (dateString: string | Date): string => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString().slice(-2);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};
