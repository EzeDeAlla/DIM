import {
	type UseMutationOptions,
	type UseMutationResult,
	type UseQueryOptions,
	type UseQueryResult,
	useMutation,
	useQuery,
} from "@tanstack/react-query";
import type { AxiosError } from "axios";

export type AxiosQueryError = {
	message: string;
	errorCode: string;
	error: {
		statusCode: number;
		errorCode: string;
	};
};

type AxiosQueryResult<TData> = Omit<UseQueryResult<TData, unknown>, "error"> & {
	error: AxiosQueryError;
};

type AxiosMutationResult<TData, TVariables> = Omit<
	UseMutationResult<TData, unknown, TVariables>,
	"error"
> & {
	error: {
		message: string;
		errorCode: string;
		error: {
			statusCode: number;
			errorCode: string;
		};
	};
};

export function useAxiosQuery<TData>(
	options: UseQueryOptions<TData, unknown, TData>,
): AxiosQueryResult<TData> {
	const result = useQuery<TData, unknown>(options);
	const { error } = result;

	return {
		...result,
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		data: (result.data as any)?.data ?? [],
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		error: (error as AxiosError)?.response?.data as any,
	};
}

export function useAxiosMutation<TData, TVariables>(
	options: UseMutationOptions<TData, unknown, TVariables>,
): AxiosMutationResult<TData, TVariables> {
	const result = useMutation<TData, unknown, TVariables>(options);
	const { error } = result;

	return {
		...result,
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		data: (result.data as any)?.data,
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		error: (error as AxiosError)?.response?.data as any,
	};
}