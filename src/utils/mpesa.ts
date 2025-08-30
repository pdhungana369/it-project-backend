export function formatPhoneNumber(phoneNumber: string): string {
	// Remove any non-digit characters
	const cleaned = phoneNumber.replace(/\D/g, "");

	// If it starts with 0, replace with 254
	if (cleaned.startsWith("0")) {
		return "254" + cleaned.substring(1);
	}

	// If it starts with +254, remove the +
	if (cleaned.startsWith("254")) {
		return cleaned;
	}

	// If it doesn't start with 254, add it
	return "254" + cleaned;
}

export function formatResponse(success: boolean, data?: any, message?: string) {
	return {
		success,
		data,
		message:
			message ||
			(success ? "Request processed successfully" : "Request failed"),
	};
}
