import React from "react"

const Alert = ({ children, className = "", ...props }) => (
  <div
    role="alert"
    className={`relative w-full rounded-lg border p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 ${className}`}
    {...props}
  >
    {children}
  </div>
)

const AlertTitle = ({ children, className = "", ...props }) => (
  <h5
    className={`mb-1 font-medium leading-none tracking-tight text-gray-900 dark:text-white ${className}`}
    {...props}
  >
    {children}
  </h5>
)

const AlertDescription = ({ children, className = "", ...props }) => (
  <div
    className={`text-sm text-gray-600 dark:text-gray-400 ${className}`}
    {...props}
  >
    {children}
  </div>
)

export { Alert, AlertTitle, AlertDescription } 