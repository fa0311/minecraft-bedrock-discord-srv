export const createLineNotifyClient = ({ url, token }: { url: string; token: string }) => {
  const sendMessage = async (message: string) => {
    await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ message }),
    });
  };

  return { sendMessage };
};
