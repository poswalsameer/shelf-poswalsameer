import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { generateUnclaimedCodesForPrint } from "~/modules/qr/service.server";
import { makeShelfError } from "~/utils/error";
import { error } from "~/utils/http.server";
import { requireAdmin } from "~/utils/roles.server";
import { createQrCodesZip } from "~/utils/zip-qr-codes";

export async function loader({ context, request }: LoaderFunctionArgs) {
  const authSession = context.getSession();
  const { userId } = authSession;

  try {
    await requireAdmin(userId);
    const url = new URL(request.url);
    const amount = Number(url.searchParams.get("amount"));

    const codes = await generateUnclaimedCodesForPrint({ amount });

    const zipBlob = await createQrCodesZip(codes);

    return new Response(zipBlob, {
      headers: {
        "content-type": "application/zip",
        "Content-Disposition": `attachment; filename="QR codes batch - ${codes[0].batch}.zip"`,
      },
    });
  } catch (cause) {
    const reason = makeShelfError(cause, { userId });
    return json(error(reason), { status: reason.status });
  }
}
